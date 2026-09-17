import React from "react";
import { Target, Eye, ShieldCheck, Handshake, MapPinned, LineChart } from "lucide-react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import CTASection from "@/components/CTASection";
import { useSettings } from "@/context/SettingsContext";

const VALUES = [
  { icon: ShieldCheck, title: "Professionalism" },
  { icon: Handshake, title: "Transparency" },
  { icon: Target, title: "Client-First Approach" },
  { icon: MapPinned, title: "UAE Market Understanding" },
  { icon: LineChart, title: "Investment-Focused Advisory" },
  { icon: Eye, title: "Long-Term Relationships" },
];

export default function About() {
  const { settings } = useSettings();
  const about = settings?.about || {};
  return (
    <div data-testid="about-page">
      <SEO title="About Homes Finder | UAE Real Estate Advisory" description="Homes Finder is a UAE real estate advisory and brokerage business built around trust, transparency and market expertise." path="/about" />
      <PageHero eyebrow="About Us" title={about.headline || "Real Estate Expertise Built Around Trust"} subtitle={about.body} image="https://images.unsplash.com/photo-1780733067347-3eb34d58f368?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />

      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VALUES.map((v, i) => (
            <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6" data-testid={`value-${i}`}>
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0"><v.icon className="h-5 w-5 text-amber-400" /></div>
              <span className="font-serif text-lg font-semibold text-slate-900">{v.title}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-slate-900 text-white p-8" data-testid="mission-block">
            <Target className="h-9 w-9 text-amber-400 mb-4" />
            <h3 className="font-serif text-2xl font-semibold">Our Mission</h3>
            <p className="mt-3 text-slate-300 leading-relaxed">{about.mission}</p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-[#FAF5E8] p-8" data-testid="vision-block">
            <Eye className="h-9 w-9 text-amber-600 mb-4" />
            <h3 className="font-serif text-2xl font-semibold text-slate-900">Our Vision</h3>
            <p className="mt-3 text-slate-700 leading-relaxed">{about.vision}</p>
          </div>
        </div>
      </Section>
      <CTASection />
    </div>
  );
}
