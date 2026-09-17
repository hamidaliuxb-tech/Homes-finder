import React from "react";
import { Link } from "react-router-dom";
import { Building2, Phone, Mail, MessageCircle, MapPin, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { waLink } from "@/components/FloatingWhatsApp";

const QUICK = [
  { to: "/buy", label: "Buy" }, { to: "/sell", label: "Sell" }, { to: "/rent", label: "Rent" },
  { to: "/off-plan", label: "Off-Plan" }, { to: "/commercial", label: "Commercial" },
  { to: "/invest", label: "Investment" }, { to: "/about", label: "About" }, { to: "/contact", label: "Contact" },
];

const LEGAL = [
  { to: "/legal/privacy-policy", label: "Privacy Policy" },
  { to: "/legal/terms", label: "Terms & Conditions" },
  { to: "/legal/cookie-policy", label: "Cookie Policy" },
  { to: "/legal/real-estate-disclaimer", label: "Real Estate Disclaimer" },
  { to: "/legal/investment-disclaimer", label: "Investment Disclaimer" },
];

export default function Footer() {
  const { settings } = useSettings();
  const c = settings?.contact || {};
  const s = settings?.social || {};
  const socials = [
    { icon: Linkedin, url: s.linkedin, key: "linkedin" },
    { icon: Instagram, url: s.instagram, key: "instagram" },
    { icon: Facebook, url: s.facebook, key: "facebook" },
    { icon: Youtube, url: s.youtube, key: "youtube" },
  ];

  return (
    <footer className="bg-slate-950 text-slate-300" data-testid="main-footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-8 w-auto" />
            <span className="font-serif text-xl font-bold text-white">Homes Finder</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            {settings?.footer_note || "Your trusted partner for residential, commercial and investment real estate opportunities across the UAE."}
          </p>
          <div className="text-amber-400 text-sm font-medium tracking-wide">Buy · Sell · Rent · Invest</div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5">
            {QUICK.map((q) => (
              <li key={q.to}>
                <Link to={q.to} className="text-sm text-slate-400 hover:text-amber-400 transition-colors" data-testid={`footer-link-${q.label.toLowerCase()}`}>{q.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2.5">
            {LEGAL.map((q) => (
              <li key={q.to}>
                <Link to={q.to} className="text-sm text-slate-400 hover:text-amber-400 transition-colors">{q.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            {c.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-400" /><a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="hover:text-amber-400">{c.phone}</a></li>}
            {c.whatsapp && <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-amber-400" /><a href={waLink(c.whatsapp, "Hello Homes Finder")} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">WhatsApp</a></li>}
            {c.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-400" /><a href={`mailto:${c.email}`} className="hover:text-amber-400 break-all">{c.email}</a></li>}
            {c.address && <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-amber-400 mt-0.5" />{c.address}</li>}
          </ul>
          <div className="flex gap-3 mt-5">
            {socials.filter((so) => so.url).map((so) => (
              <a key={so.key} href={so.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors" data-testid={`footer-social-${so.key}`}>
                <so.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Homes Finder. All Rights Reserved.</p>
          <Link to="/admin" className="text-xs text-slate-600 hover:text-amber-400" data-testid="footer-admin-link">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
