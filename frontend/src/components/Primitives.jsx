import React from "react";

export function PageHero({ eyebrow, title, subtitle, image, children }) {
  return (
    <section className="relative bg-slate-900 text-white overflow-hidden" data-testid="page-hero">
      {image && (
        <div className="absolute inset-0">
          <img src={image} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-900/40" />
        </div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400 mb-4">{eyebrow}</p>}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl">{title}</h1>
        {subtitle && <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Section({ children, className = "", ...props }) {
  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 ${className}`} {...props}>
      {children}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center }) {
  return (
    <div className={`mb-12 ${center ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}`}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 mb-3">{eyebrow}</p>}
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="mt-4 text-slate-600 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
