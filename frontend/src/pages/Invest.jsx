import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe2, Building2, KeyRound, TrendingUp, Landmark, Users, Plane,
  Target, LineChart, MapPin, Layers, Wallet, PieChart, Scale, LogOut, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import CTASection from "@/components/CTASection";
import ROICalculator from "@/components/ROICalculator";

const WHY_UAE = [
  { icon: Globe2, title: "International Investor Demand", desc: "Strong and diverse global interest in UAE property." },
  { icon: Building2, title: "Diverse Property Market", desc: "Residential, commercial and off-plan options across emirates." },
  { icon: KeyRound, title: "Rental Opportunities", desc: "Active residential and commercial rental market." },
  { icon: TrendingUp, title: "Capital Appreciation Potential", desc: "Opportunities across selected communities and asset types." },
  { icon: Landmark, title: "Freehold Opportunities", desc: "Freehold ownership available to foreign investors in designated areas." },
  { icon: Users, title: "Business & Population Growth", desc: "A growing economy and expanding resident base." },
  { icon: Plane, title: "Tourism & Infrastructure", desc: "Ongoing tourism and infrastructure development." },
];

const ADVISORY = [
  { icon: Target, title: "Investment Property Selection" },
  { icon: LineChart, title: "Rental Yield Analysis" },
  { icon: TrendingUp, title: "Capital Appreciation Analysis" },
  { icon: MapPin, title: "Location Analysis" },
  { icon: Building2, title: "Developer Assessment" },
  { icon: Layers, title: "Off-plan Evaluation" },
  { icon: Wallet, title: "Investment Budget Planning" },
  { icon: PieChart, title: "Portfolio Diversification" },
  { icon: Scale, title: "Buy vs Rent Analysis" },
  { icon: LogOut, title: "Property Exit Strategy" },
];

export default function Invest() {
  const navigate = useNavigate();
  return (
    <div data-testid="invest-page">
      <SEO title="Property Investment in the UAE | Homes Finder" description="Invest in UAE real estate with greater confidence. Homes Finder is your real estate investment advisory partner for yield, capital growth and portfolio strategy." path="/invest" />
      <PageHero eyebrow="Invest" title="Invest in UAE Real Estate With Greater Confidence" subtitle="We act as your real estate investment advisory partner — helping you evaluate opportunities based on data, not hype." image="https://images.unsplash.com/photo-1747380755783-61befe9b3da7?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000">
        <Button onClick={() => navigate("/contact")} data-testid="invest-advisor-btn" className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold rounded-full px-7 h-12">Speak to an Investment Advisor</Button>
      </PageHero>

      <Section>
        <SectionHeading eyebrow="The Opportunity" title="Why UAE Real Estate?" subtitle="Several structural factors make the UAE a notable real estate market. Consider these alongside independent advice." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_UAE.map((w, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow" data-testid={`why-uae-${i}`}>
              <w.icon className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="font-serif text-lg font-semibold text-slate-900">{w.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{w.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-amber-300 bg-[#FAF5E8] p-5 text-sm text-slate-700" data-testid="invest-disclaimer">
          <strong className="text-slate-900">Please note:</strong> Property values, rental yields, capital appreciation and investment returns are not guaranteed and depend on market conditions. Homes Finder does not make guaranteed-return claims.
        </div>
      </Section>

      <section className="bg-slate-900 text-white" data-testid="advisory-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400 mb-3">Investment Advisory</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold max-w-3xl">Beyond Property Sales. We Help You Evaluate Investments.</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ADVISORY.map((a, i) => (
              <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:border-amber-500/50 transition-colors" data-testid={`advisory-${i}`}>
                <a.icon className="h-6 w-6 text-amber-400 mb-3" />
                <h3 className="text-sm font-semibold">{a.title}</h3>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate("/contact")} className="mt-10 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold rounded-full px-7 h-12">Speak to an Investment Advisor</Button>
        </div>
      </section>

      <Section className="bg-white">
        <SectionHeading eyebrow="Tools" title="Rental Yield & ROI Calculator" subtitle="Estimate an indicative gross rental yield. For illustration only — not financial advice." />
        <ROICalculator />
      </Section>

      <CTASection waContext="invest" />
    </div>
  );
}
