import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  Cookie,
  Building,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react";
import SEO from "@/components/SEO";
import { PageHero, Section } from "@/components/Primitives";
import { useSettings } from "@/context/SettingsContext";

const LEGAL_DOCS = [
  { slug: "privacy-policy", title: "Privacy Policy", icon: ShieldCheck },
  { slug: "terms", title: "Terms & Conditions", icon: FileText },
  { slug: "cookie-policy", title: "Cookie Policy", icon: Cookie },
  { slug: "real-estate-disclaimer", title: "Real Estate Disclaimer", icon: Building },
  { slug: "investment-disclaimer", title: "Investment Disclaimer", icon: AlertTriangle },
];

const CONTENT = {
  "privacy-policy": {
    title: "Privacy Policy",
    subtitle: "How Homes Finder collects, manages, and safeguards your personal data.",
    body: [
      "Homes Finder respects your privacy. This policy explains how we collect, use and protect the information you provide through our website.",
      "We collect information you submit via enquiry and consultation forms (such as your name, mobile number and email) to respond to your request and provide our services.",
      "We do not sell your personal information. We may use trusted service providers to help us operate our website and communicate with you.",
      "You may contact us at any time to request access to, correction of, or deletion of your personal information.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    subtitle: "Terms and conditions governing the use of the Homes Finder portal and services.",
    body: [
      "By using this website you agree to these terms. The content on this website is provided for general information purposes only.",
      "Property listings labelled as 'Demo Property' are illustrative and do not represent actual available inventory unless confirmed by Homes Finder.",
      "Homes Finder makes no warranty regarding the accuracy or completeness of information and reserves the right to update content at any time.",
      "Nothing on this website constitutes financial, legal or investment advice.",
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    subtitle: "Information regarding cookies and web technologies used on this website.",
    body: [
      "This website may use cookies and similar technologies to improve your browsing experience and understand how the site is used.",
      "You can control or delete cookies through your browser settings. Disabling cookies may affect some functionality.",
    ],
  },
  "real-estate-disclaimer": {
    title: "Real Estate Disclaimer",
    subtitle: "Important disclaimers and notices regarding UAE property listings and details.",
    body: [
      "All property information, images, prices and specifications on this website are provided for general guidance and may change without notice.",
      "Demo properties are clearly labelled and are used for demonstration purposes only until actual company listings are added.",
      "Prospective buyers and tenants should independently verify all details before entering into any transaction.",
    ],
  },
  "investment-disclaimer": {
    title: "Investment Disclaimer",
    subtitle: "Advisory notices concerning property valuation, yields, and investment returns.",
    body: [
      "Property values, rental yields, capital appreciation and investment returns are not guaranteed and depend on market conditions.",
      "Any figures, calculators or projections presented on this website are indicative and for illustration only. They do not constitute financial or investment advice.",
      "You should seek independent professional advice before making any property investment decision.",
    ],
  },
};

export default function Legal() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const currentSlug = slug || "privacy-policy";
  const page = CONTENT[currentSlug] || CONTENT["privacy-policy"];
  const c = settings?.contact || {};

  return (
    <div data-testid="legal-page" className="bg-slate-50 min-h-screen">
      <SEO
        title={`${page.title} | Homes Finder UAE`}
        description={`${page.title} for Homes Finder UAE real estate advisory.`}
        path={`/legal/${currentSlug}`}
      />

      {/* Luxury Hero Banner */}
      <PageHero
        eyebrow="Legal & Governance"
        title={page.title}
        subtitle={page.subtitle}
        image="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000"
      />

      <Section className="py-12 md:py-16">
        {/* Mobile Document Selector */}
        <div className="lg:hidden mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {LEGAL_DOCS.map((doc) => {
              const active = currentSlug === doc.slug;
              const Icon = doc.icon;
              return (
                <Link
                  key={doc.slug}
                  to={`/legal/${doc.slug}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-slate-900 text-amber-300 shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                  {doc.title}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Desktop Navigation Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Legal Documents
              </div>
              {LEGAL_DOCS.map((doc) => {
                const active = currentSlug === doc.slug;
                const Icon = doc.icon;
                return (
                  <Link
                    key={doc.slug}
                    to={`/legal/${doc.slug}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-sm font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                      <span>{doc.title}</span>
                    </div>
                    {active && <ChevronRight className="h-4 w-4 text-amber-400" />}
                  </Link>
                );
              })}

              {/* Contact Assistance Box */}
              <div className="mt-8 pt-6 border-t border-slate-100 p-3 bg-slate-50/70 rounded-xl">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  Questions & Enquiries
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Need clarification on compliance, contracts, or policies?
                </p>
                <div className="space-y-2 text-xs text-slate-700">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-2 text-slate-700 hover:text-amber-600 font-medium"
                    >
                      <Phone className="h-3.5 w-3.5 text-amber-500" />
                      {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-2 text-slate-700 hover:text-amber-600 font-medium break-all"
                    >
                      <Mail className="h-3.5 w-3.5 text-amber-500" />
                      {c.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-8">
            <article className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-sm">
              {/* Document Header Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> Official Policy
                  </span>
                  <span className="text-xs text-slate-500">Homes Finder UAE</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last updated: 2026</span>
                </div>
              </div>

              <h1
                className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-6"
                data-testid="legal-title"
              >
                {page.title}
              </h1>

              {/* Exact Legal Body Paragraphs */}
              <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed">
                {page.body.map((p, i) => (
                  <div
                    key={i}
                    className="p-5 sm:p-6 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-amber-200/60 transition-colors"
                  >
                    <p className="text-slate-800 leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>

              {/* Disclaimer Notice Box */}
              <div className="mt-10 p-5 rounded-xl bg-slate-900 text-slate-300 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-1">Notice to Clients</span>
                  This document is maintained in accordance with UAE commercial and real estate regulations. For formal legal consultations, please consult an accredited UAE legal practitioner.
                </div>
              </div>
            </article>
          </main>
        </div>
      </Section>
    </div>
  );
}
