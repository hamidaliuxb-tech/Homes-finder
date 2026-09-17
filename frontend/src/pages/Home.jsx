import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, TrendingUp, MapPinned, LineChart, Handshake, Repeat,
  ArrowRight, MessageCircle, Home as HomeIcon, KeyRound, Building, Landmark, HardHat, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import PropertySearch from "@/components/PropertySearch";
import PropertyCard from "@/components/PropertyCard";
import CTASection from "@/components/CTASection";
import MortgageCalculator from "@/components/MortgageCalculator";
import { Section, SectionHeading } from "@/components/Primitives";
import { useSettings } from "@/context/SettingsContext";
import { CATEGORY_CARDS } from "@/data/site";
import { api } from "@/lib/apiClient";
import { waLink } from "@/components/FloatingWhatsApp";

const HERO_IMG = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000";

const CAT_ICONS = { buy: HomeIcon, sell: Landmark, rent: KeyRound, invest: TrendingUp, offplan: HardHat, commercial: Store };

const WHY = [
  { icon: ShieldCheck, title: "Professional Advisory", desc: "Property decisions supported by structured market analysis." },
  { icon: Handshake, title: "Transparency", desc: "Clear communication without misleading promises." },
  { icon: MapPinned, title: "Market Knowledge", desc: "Local understanding of UAE property markets." },
  { icon: LineChart, title: "Investment Focus", desc: "We look beyond the property and consider its investment potential." },
  { icon: Building, title: "End-to-End Support", desc: "From property selection to transaction completion." },
  { icon: Repeat, title: "Long-Term Relationship", desc: "We aim to build lasting client relationships rather than one-time transactions." },
];

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [featured, setFeatured] = React.useState([]);
  const number = settings?.contact?.whatsapp || "971501184777";

  React.useEffect(() => {
    api.get("/properties", { params: { featured: true, limit: 6, sort: "featured" } })
      .then((r) => setFeatured(r.data)).catch(() => {});
  }, []);

  const stats = settings?.stats || [];
  const hero = settings?.hero || {};

  const schema = {
    "@context": "https://schema.org", "@type": "RealEstateAgent",
    name: "Homes Finder", description: "UAE real estate advisory and brokerage",
    areaServed: "United Arab Emirates",
    telephone: settings?.contact?.phone, email: settings?.contact?.email,
  };

  return (
    <div data-testid="home-page">
      <SEO
        title="Homes Finder | Buy, Sell, Rent & Invest in UAE Real Estate"
        description="Homes Finder provides professional real estate services across the UAE, including property buying, selling, renting, investment advisory, off-plan and commercial real estate."
        path="/"
        schema={schema}
      />

      {/* HERO */}
      <section className="relative bg-slate-950 text-white" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="UAE luxury real estate" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400 mb-5">Trusted Property Advisory · UAE</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              {hero.headline || "Your Property. Your Investment. Your Future."}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-200 leading-relaxed max-w-2xl">
              {hero.subheadline || "Buy, sell, rent and invest with confidence through expert property advisory and market knowledge across the UAE."}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mt-10">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-amber-400">Find Your Property</span>
            </div>
            <PropertySearch variant="hero" />
          </motion.div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/sell")} data-testid="hero-sell-btn" className="bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-full px-6">
              Sell Your Property
            </Button>
            <Button onClick={() => navigate("/contact")} data-testid="hero-consult-btn" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 font-semibold rounded-full px-6">
              Book a Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-slate-900 border-t border-amber-500/20" data-testid="stats-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-amber-400 mb-8">{settings?.stats_heading || "UAE Real Estate Expertise"}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400">{s.value}</div>
                <div className="mt-2 text-sm text-slate-300">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <Section>
        <SectionHeading eyebrow="What We Do" title="Real Estate Services Across the UAE" subtitle="From finding your next home to building an investment portfolio — we support every property decision." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_CARDS.map((c) => {
            const Icon = CAT_ICONS[c.key] || HomeIcon;
            return (
              <Link key={c.key} to={c.to} data-testid={`category-card-${c.key}`} className="group relative bg-white border border-slate-200 rounded-2xl p-7 hover:border-amber-400 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-5 group-hover:bg-amber-500 transition-colors">
                  <Icon className="h-6 w-6 text-amber-400 group-hover:text-slate-950" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-slate-900">{c.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{c.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-600 group-hover:gap-2 transition-all">Explore <ArrowRight className="h-4 w-4" /></span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="bg-white" data-testid="featured-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <SectionHeading eyebrow="Handpicked" title="Featured Properties" />
              <Button onClick={() => navigate("/buy")} variant="outline" className="border-slate-300 hover:bg-slate-900 hover:text-white" data-testid="view-all-properties-btn">View All Properties</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* WHY */}
      <Section>
        <SectionHeading center eyebrow="Why Homes Finder" title="Why Choose Us?" subtitle="A property advisory partner focused on trust, transparency and long-term client success." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY.map((w, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg transition-shadow" data-testid={`why-card-${i}`}>
              <w.icon className="h-9 w-9 text-amber-500 mb-4" />
              <h3 className="font-serif text-lg font-semibold text-slate-900">{w.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* MORTGAGE CALCULATOR */}
      <section className="bg-white" data-testid="home-mortgage-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <SectionHeading center eyebrow="Plan Your Purchase" title="Mortgage Calculator" subtitle="Estimate your monthly repayments in seconds. Adjust the price, down payment, term and rate to see indicative figures." />
          <MortgageCalculator price={2850000} />
        </div>
      </section>

      <CTASection />
    </div>
  );
}
