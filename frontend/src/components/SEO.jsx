import { useEffect } from "react";

export default function SEO({ title, description, path, schema }) {
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (attr, key, content) => {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + (path || window.location.pathname));

    const prev = document.getElementById("page-jsonld");
    if (prev) prev.remove();
    if (schema) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = "page-jsonld";
      s.text = JSON.stringify(schema);
      document.head.appendChild(s);
    }
  }, [title, description, path, schema]);

  return null;
}
