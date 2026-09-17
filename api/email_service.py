import os
import re
import ipaddress
import logging
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Homes Finder")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "Homes Finder <onboarding@resend.dev>")

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM = os.environ.get("SMTP_FROM") or SMTP_USER


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    _assert_safe_email(subject, html)

    # 1. Standard SMTP (Hostinger / Custom Domain)
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{EMAIL_FROM_NAME} <{SMTP_FROM}>"
            msg["To"] = to
            if reply_to or EMAIL_REPLY_TO:
                msg["Reply-To"] = reply_to or EMAIL_REPLY_TO
            msg.attach(MIMEText(html, "html", "utf-8"))

            if SMTP_PORT == 465:
                with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SMTP_FROM, [to], msg.as_string())
            else:
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                    server.starttls()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SMTP_FROM, [to], msg.as_string())
            logger.info(f"Email successfully sent via SMTP to {to}")
            return "smtp_success"
        except Exception as e:
            logger.error(f"SMTP send failed: {e}")

    # 2. Resend API (Fallback)
    if RESEND_API_KEY:
        try:
            payload = {
                "from": RESEND_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
            if reply_to or EMAIL_REPLY_TO:
                payload["reply_to"] = reply_to or EMAIL_REPLY_TO
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            resp.raise_for_status()
            resend_id = resp.json().get("id")
            logger.info(f"Email successfully sent via Resend: id={resend_id} to={to}")
            return resend_id
        except Exception as e:
            logger.error(f"Resend send failed: {e}")
            msg["From"] = f"{EMAIL_FROM_NAME} <{SMTP_FROM}>"
            msg["To"] = to
            if reply_to or EMAIL_REPLY_TO:
                msg["Reply-To"] = reply_to or EMAIL_REPLY_TO
            msg.attach(MIMEText(html, "html", "utf-8"))

            if SMTP_PORT == 465:
                with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SMTP_FROM, [to], msg.as_string())
            else:
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                    server.starttls()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.sendmail(SMTP_FROM, [to], msg.as_string())
            logger.info(f"Email successfully sent via SMTP to {to}")
            return "smtp_success"
        except Exception as e:
            logger.error(f"SMTP send failed: {e}")

    # 2. Legacy API
    if EMAIL_KEY:
        try:
            payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
            if reply_to or EMAIL_REPLY_TO:
                payload["contact_email"] = reply_to or EMAIL_REPLY_TO
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{EMAIL_BASE_URL}/api/v1/email/send",
                    headers={"X-Email-Key": EMAIL_KEY},
                    json=payload,
                )
            resp.raise_for_status()
            return resp.json().get("id")
        except Exception as e:
            logger.warning(f"Legacy email API error: {str(e)}")

    logger.info(f"Email logged (SMTP not configured): {subject} -> {to}")
    return "logged"



def build_lead_email(lead: dict) -> tuple[str, str]:
    subject = f"New {escape(str(lead.get('requirement', 'enquiry')))} lead — {EMAIL_FROM_NAME}"
    rows = ""
    fields = [
        ("Name", lead.get("name")),
        ("Mobile", lead.get("mobile")),
        ("Email", lead.get("email")),
        ("Requirement", lead.get("requirement")),
        ("Property", lead.get("property_title")),
        ("Location", lead.get("location")),
        ("Property Type", lead.get("property_type")),
        ("Bedrooms", lead.get("bedrooms")),
        ("Property Size", lead.get("property_size")),
        ("Expected Price", lead.get("expected_price")),
        ("Message", lead.get("message")),
    ]
    for label, value in fields:
        if value:
            rows += (
                f'<tr><td style="padding:8px 12px;font-weight:600;color:#111827;'
                f'border-bottom:1px solid #eee">{escape(label)}</td>'
                f'<td style="padding:8px 12px;color:#374151;border-bottom:1px solid #eee">'
                f'{escape(str(value))}</td></tr>'
            )
    html = (
        f'<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;'
        f'font-family:Arial,sans-serif"><tr><td style="background:#0B132B;padding:24px;">'
        f'<span style="color:#C5A059;font-size:20px;font-weight:700">Homes Finder</span>'
        f'<div style="color:#fff;font-size:13px;margin-top:4px">New Website Enquiry</div></td></tr>'
        f'<tr><td style="padding:24px"><p style="color:#111827">A new enquiry was submitted '
        f'on your website:</p><table role="presentation" width="100%" style="border-collapse:collapse">'
        f'{rows}</table></td></tr>'
        f'<tr><td style="padding:16px 24px;font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}. '
        f'We never ask for your password or card details by email.</td></tr></table>'
    )
    return subject, html
