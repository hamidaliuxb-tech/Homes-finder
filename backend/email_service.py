import os
import re
import ipaddress
import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587") or "587")
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "").strip() or SMTP_USER
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.environ.get("SMTP_USE_SSL", "false").lower() == "true"
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Homes Finder")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").strip().rstrip("/")

EMAIL_ADDRESSES = {
    "general": os.environ.get("EMAIL_GENERAL", "enquiries@homesfinder.ae"),
    "sales": os.environ.get("EMAIL_SALES", "sales@homesfinder.ae"),
    "rentals": os.environ.get("EMAIL_RENTALS", "rentals@homesfinder.ae"),
    "listing": os.environ.get("EMAIL_LISTING", "listing@homesfinder.ae"),
    "invest": os.environ.get("EMAIL_INVEST", "invest@homesfinder.ae"),
}
SUPPORT_EMAIL = EMAIL_ADDRESSES["general"]

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "enter your password below", "confirm your card number", "your full card number",
             "seed phrase", "recovery phrase", "social security number", "confirm your bank details")


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls = set(), []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields allowed in email")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks recipient for credentials: {p!r}")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r}")
        host = urlparse(low).hostname or ""
        if not _host_ok(host):
            raise ValueError(f"Unsafe URL in email: {url!r}")


def _send_sync(to, subject, html, reply_to):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{EMAIL_FROM_NAME} <{SMTP_FROM}>"
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.attach(MIMEText(html, "html"))
    if SMTP_USE_SSL:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        if SMTP_USE_TLS:
            server.starttls()
    try:
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, [to], msg.as_string())
    finally:
        server.quit()


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> bool:
    _assert_safe_email(subject, html)
    if not SMTP_HOST or not SMTP_FROM or not to:
        logger.info(f"SMTP not configured; skipping email to {to} ('{subject}').")
        return False
    try:
        await asyncio.to_thread(_send_sync, to, subject, html, reply_to)
        return True
    except Exception as e:
        logger.error(f"SMTP send failed: {e}")
        return False


def route_recipient(requirement: str = "", purpose: str = "") -> str:
    t = f"{requirement} {purpose}".lower()
    if "valuation" in t or "sell" in t or "list" in t:
        return EMAIL_ADDRESSES["listing"] if "list" in t else EMAIL_ADDRESSES["sales"]
    if "rent" in t:
        return EMAIL_ADDRESSES["rentals"]
    if "invest" in t:
        return EMAIL_ADDRESSES["invest"]
    if "buy" in t or "sale" in t or "property enquiry" in t:
        return EMAIL_ADDRESSES["sales"]
    return EMAIL_ADDRESSES["general"]


def _brand_wrap(heading: str, body_html: str, cta_text: str = "", cta_url: str = "") -> str:
    cta = ""
    if cta_text and cta_url:
        cta = (f'<tr><td style="padding:8px 24px 24px"><a href="{escape(cta_url)}" '
               f'style="display:inline-block;background:#C5A059;color:#0B132B;text-decoration:none;'
               f'font-weight:700;padding:12px 26px;border-radius:9999px;font-family:Arial,sans-serif">'
               f'{escape(cta_text)}</a></td></tr>')
    legal = ""
    if PUBLIC_BASE_URL:
        legal = (f' · <a href="{PUBLIC_BASE_URL}/legal/privacy-policy" style="color:#888">Privacy</a>'
                 f' · <a href="{PUBLIC_BASE_URL}/legal/terms" style="color:#888">Terms</a>')
    return (
        f'<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;'
        f'border:1px solid #eee;border-radius:12px;overflow:hidden">'
        f'<tr><td style="background:#0B132B;padding:24px"><span style="color:#C5A059;font-size:22px;font-weight:700">'
        f'Homes Finder</span><div style="color:#cbb27a;font-size:11px;letter-spacing:2px;margin-top:4px">'
        f'UAE REAL ESTATE ADVISORY</div></td></tr>'
        f'<tr><td style="padding:24px 24px 8px"><h1 style="margin:0;color:#0B132B;font-size:20px">{escape(heading)}</h1></td></tr>'
        f'<tr><td style="padding:8px 24px 8px;color:#374151;font-size:14px;line-height:1.6">{body_html}</td></tr>'
        f'{cta}'
        f'<tr><td style="padding:16px 24px;background:#FAFAFA;font-size:12px;color:#888;border-top:1px solid #eee">'
        f'Homes Finder · <a href="mailto:{SUPPORT_EMAIL}" style="color:#888">{SUPPORT_EMAIL}</a>{legal}<br>'
        f'We never ask for your password or card details by email.</td></tr></table>'
    )


def _kv(label, value):
    if not value:
        return ""
    return (f'<tr><td style="padding:6px 0;font-weight:600;color:#111827">{escape(str(label))}</td>'
            f'<td style="padding:6px 0 6px 16px;color:#374151">{escape(str(value))}</td></tr>')


# ---- Builders ----
def build_welcome_email(user: dict, verify_url: str | None):
    body = (f'<p>Welcome to Homes Finder, {escape(user.get("name",""))}. Your account has been created successfully '
            f'with the email <strong>{escape(user.get("email",""))}</strong>.</p>'
            f'<p>You can now sign in, access your dashboard and list your properties for sale or rent.</p>')
    if verify_url:
        body += '<p>Please verify your email address to fully activate your account:</p>'
        return "Welcome to HomesFinder — Registration Successful", _brand_wrap("Registration Successful", body, "Verify Email Address", verify_url)
    return "Welcome to HomesFinder — Registration Successful", _brand_wrap("Registration Successful", body, "Sign In", f"{PUBLIC_BASE_URL}/login" if PUBLIC_BASE_URL else "")


def build_verify_email(user: dict, verify_url: str):
    body = f'<p>Please confirm your email address to activate your Homes Finder account.</p>'
    return "Verify Your HomesFinder Account", _brand_wrap("Verify Your Email", body, "Verify Email Address", verify_url)


def build_password_reset_email(user: dict, reset_url: str):
    body = ('<p>We received a request to reset your Homes Finder password. This link expires in 1 hour. '
            'If you did not request this, you can safely ignore this email.</p>')
    return "Reset Your HomesFinder Password", _brand_wrap("Password Reset", body, "Reset Password", reset_url)


def build_property_submitted_email(user: dict, prop: dict):
    rows = "".join([_kv("Reference", prop.get("reference")), _kv("Title", prop.get("title")),
                    _kv("Listing", "For Rent" if prop.get("purpose") == "rent" else "For Sale"),
                    _kv("Submitted", (prop.get("submitted_at") or "")[:10]), _kv("Status", "Pending Approval")])
    body = ('<p>Thank you. Your property has been received and is awaiting review by the Homes Finder team.</p>'
            f'<table role="presentation">{rows}</table>'
            '<p style="margin-top:12px"><strong>Your property is not yet live on Homes Finder.</strong> '
            'It will be published only after approval by our administration team.</p>')
    url = f"{PUBLIC_BASE_URL}/dashboard" if PUBLIC_BASE_URL else ""
    return "HomesFinder — Property Submitted for Approval", _brand_wrap("Property Submitted for Approval", body, "Return to Dashboard", url)


def build_property_approved_email(user: dict, prop: dict):
    rows = "".join([_kv("Reference", prop.get("reference")), _kv("Title", prop.get("title")),
                    _kv("Listing", "For Rent" if prop.get("purpose") == "rent" else "For Sale"),
                    _kv("Location", prop.get("location")), _kv("Price", prop.get("price"))])
    body = ('<p>Congratulations! Your property has been approved and is now live on the Homes Finder website.</p>'
            f'<table role="presentation">{rows}</table>')
    url = f"{PUBLIC_BASE_URL}/property/{prop.get('slug')}" if PUBLIC_BASE_URL and prop.get("slug") else (f"{PUBLIC_BASE_URL}/dashboard" if PUBLIC_BASE_URL else "")
    return "Congratulations — Your Property Is Now Live on HomesFinder", _brand_wrap("Your Property Is Now Live", body, "View My Live Property", url)


def build_property_rejected_email(user: dict, prop: dict, reason: str):
    rows = "".join([_kv("Reference", prop.get("reference")), _kv("Title", prop.get("title")), _kv("Reason", reason)])
    body = ('<p>Your property listing requires attention before it can be published.</p>'
            f'<table role="presentation">{rows}</table>'
            '<p style="margin-top:12px">Please review the reason above, update your listing and resubmit it for approval.</p>')
    url = f"{PUBLIC_BASE_URL}/dashboard" if PUBLIC_BASE_URL else ""
    return "HomesFinder — Property Listing Requires Attention", _brand_wrap("Property Listing Requires Attention", body, "Edit Property", url)


def build_changes_required_email(user: dict, prop: dict, comments: str):
    rows = "".join([_kv("Reference", prop.get("reference")), _kv("Title", prop.get("title")), _kv("Requested changes", comments)])
    body = ('<p>Our team has requested some changes to your property listing before it can go live.</p>'
            f'<table role="presentation">{rows}</table>'
            '<p style="margin-top:12px">Please sign in, update your listing and resubmit it for approval.</p>')
    url = f"{PUBLIC_BASE_URL}/dashboard" if PUBLIC_BASE_URL else ""
    return "HomesFinder — Changes Required for Your Property Listing", _brand_wrap("Changes Required", body, "Edit Property", url)


def build_enquiry_ack_email(lead: dict):
    body = (f'<p>Dear {escape(lead.get("name",""))}, thank you for contacting Homes Finder. '
            'We have received your enquiry and a member of our team will be in touch shortly.</p>')
    if lead.get("property_title"):
        body += f'<p>Regarding: <strong>{escape(lead["property_title"])}</strong></p>'
    return "Thank you for contacting HomesFinder", _brand_wrap("We've Received Your Enquiry", body)


def build_admin_new_property_email(prop: dict, customer: dict):
    rows = "".join([_kv("Reference", prop.get("reference")), _kv("Title", prop.get("title")),
                    _kv("Customer", customer.get("name")), _kv("Email", customer.get("email")),
                    _kv("Phone", customer.get("phone")), _kv("Location", prop.get("location")),
                    _kv("Price", prop.get("price")), _kv("Listing", "For Rent" if prop.get("purpose") == "rent" else "For Sale")])
    body = f'<p>A new property has been submitted and is awaiting approval.</p><table role="presentation">{rows}</table>'
    url = f"{PUBLIC_BASE_URL}/admin" if PUBLIC_BASE_URL else ""
    return "HomesFinder — New Property Awaiting Approval", _brand_wrap("New Property Awaiting Approval", body, "Open Admin Dashboard", url)


def build_lead_email(lead: dict) -> tuple[str, str]:
    subject = f"New {escape(str(lead.get('requirement', 'enquiry')))} lead — {EMAIL_FROM_NAME}"
    fields = [("Name", lead.get("name")), ("Mobile", lead.get("mobile")), ("Email", lead.get("email")),
              ("Requirement", lead.get("requirement")), ("Property", lead.get("property_title")),
              ("Location", lead.get("location")), ("Property Type", lead.get("property_type")),
              ("Bedrooms", lead.get("bedrooms")), ("Property Size", lead.get("property_size")),
              ("Expected Price", lead.get("expected_price")), ("Message", lead.get("message"))]
    rows = "".join(_kv(l, v) for l, v in fields)
    body = f'<p>A new enquiry was submitted on your website:</p><table role="presentation">{rows}</table>'
    return subject, _brand_wrap("New Website Enquiry", body)
