import React, { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY || "0x4AAAAAAE8__XJJGbP1v6LP";

// Cloudflare Turnstile widget. When no site key is configured (preview/dev),
// renders a clear notice and returns a dev token so the flow is testable.
export default function Turnstile({ onToken }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) { onToken("dev-bypass"); return; }
    const id = "cf-turnstile-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = () => setReady(true);
      document.head.appendChild(s);
    } else {
      setReady(true);
    }
  }, [onToken]);

  useEffect(() => {
    let widgetId = null;
    if (ready && SITE_KEY && window.turnstile && ref.current) {
      try {
        ref.current.innerHTML = "";
        widgetId = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          appearance: "always",
          theme: "light",
          callback: (t) => onToken(t),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      } catch (e) {
        console.error("Turnstile render error:", e);
      }
    }
    return () => {
      if (widgetId && window.turnstile?.remove) {
        try { window.turnstile.remove(widgetId); } catch (_) {}
      }
    };
  }, [ready, onToken]);

  if (!SITE_KEY) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" data-testid="turnstile-dev">
        <span className="inline-block h-5 w-5 rounded bg-emerald-500" />
        <span className="text-sm text-slate-600">Anti-bot verification (configure Turnstile keys in production)</span>
      </div>
    );
  }
  return <div ref={ref} data-testid="turnstile-widget" className="min-h-[65px]" />;
}
