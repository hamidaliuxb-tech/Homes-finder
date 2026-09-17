import React from "react";
import { Section, SectionHeading } from "@/components/Primitives";
import LeadForm from "@/components/LeadForm";

export default function InfoPageSection({ children }) {
  return <>{children}</>;
}

export function ProcessSteps({ steps, title = "Our Process", eyebrow = "How It Works" }) {
  return (
    <Section className="bg-white rounded-none">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <div key={i} className="relative bg-[#FAFAFA] border border-slate-200 rounded-xl p-6" data-testid={`process-step-${i + 1}`}>
            <span className="font-serif text-4xl font-bold text-amber-500/40">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-serif text-lg font-semibold text-slate-900">{s.title || s}</h3>
            {s.desc && <p className="mt-2 text-sm text-slate-600">{s.desc}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function FeatureList({ items, title, eyebrow, columns = 3 }) {
  return (
    <Section>
      {title && <SectionHeading eyebrow={eyebrow} title={title} />}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
        {items.map((it, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-amber-400/60 hover:shadow-lg transition-all" data-testid={`feature-item-${i}`}>
            {it.icon && <it.icon className="h-8 w-8 text-amber-500 mb-4" />}
            <h3 className="font-serif text-lg font-semibold text-slate-900">{it.title}</h3>
            {it.desc && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{it.desc}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function LeadFormBlock({ requirement, title, subtitle, extended, submitLabel, id }) {
  return (
    <Section className="bg-white" id={id}>
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <SectionHeading eyebrow="Get In Touch" title={title} subtitle={subtitle} />
        </div>
        <div className="bg-[#FAFAFA] border border-slate-200 rounded-2xl p-6 sm:p-8">
          <LeadForm requirement={requirement} extended={extended} submitLabel={submitLabel} />
        </div>
      </div>
    </Section>
  );
}
