import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/buy", label: "Buy" },
  { to: "/sell", label: "Sell" },
  { to: "/rent", label: "Rent" },
  { to: "/invest", label: "Invest" },
  { to: "/off-plan", label: "Off-Plan" },
  { to: "/commercial", label: "Commercial" },
  { to: "/services", label: "Property Services" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const phone = settings?.contact?.phone || "+971 50 118 4777";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-amber-500/20 bg-slate-900/95 backdrop-blur-md text-white transition-shadow ${scrolled ? "shadow-lg shadow-black/30" : ""}`}
      data-testid="main-navbar"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-20">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="navbar-logo">
          <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-9 w-auto" />
          <div className="leading-none">
            <span className="font-serif text-xl lg:text-2xl font-bold tracking-tight">Homes Finder</span>
            <span className="block text-[10px] tracking-[0.25em] text-amber-400/90 uppercase mt-0.5">UAE Real Estate Advisory</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-link-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${isActive ? "text-amber-400" : "text-slate-200 hover:text-amber-400"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 xl:gap-3">
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hidden 2xl:flex items-center gap-2 text-sm text-slate-200 hover:text-amber-400" data-testid="navbar-phone">
            <Phone className="h-4 w-4" /> {phone}
          </a>
          <Button
            onClick={() => navigate("/contact")}
            data-testid="navbar-book-consultation"
            className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold rounded-full text-xs xl:text-sm px-3.5 xl:px-4 py-2"
          >
            Book a Consultation
          </Button>
        </div>

        <button className="lg:hidden p-2 text-white" onClick={() => setOpen(!open)} data-testid="navbar-mobile-toggle" aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-slate-900 border-t border-amber-500/20 max-h-[80vh] overflow-y-auto" data-testid="mobile-menu">
          <div className="px-4 py-3 space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium ${isActive ? "bg-slate-800 text-amber-400" : "text-slate-200 hover:bg-slate-800"}`
                }
              >
                {n.label} <ChevronRight className="h-4 w-4 opacity-50" />
              </NavLink>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 px-3 text-sm text-slate-200">
                <Phone className="h-4 w-4" /> {phone}
              </a>
              <Button onClick={() => { setOpen(false); navigate("/contact"); }} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold w-full">
                Book a Consultation
              </Button>
              <Button onClick={() => { setOpen(false); navigate("/sell"); }} variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-slate-950 w-full">
                List Your Property
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
