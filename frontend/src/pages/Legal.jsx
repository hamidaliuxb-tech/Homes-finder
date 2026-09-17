import React from "react";
import { useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Section } from "@/components/Primitives";

const CONTENT = {
  "privacy-policy": {
    title: "Privacy Policy",
    body: [
      "Homes Finder respects your privacy. This policy explains how we collect, use and protect the information you provide through our website.",
      "We collect information you submit via enquiry and consultation forms (such as your name, mobile number and email) to respond to your request and provide our services.",
      "We do not sell your personal information. We may use trusted service providers to help us operate our website and communicate with you.",
      "You may contact us at any time to request access to, correction of, or deletion of your personal information.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "By using this website you agree to these terms. The content on this website is provided for general information purposes only.",
      "Property listings labelled as 'Demo Property' are illustrative and do not represent actual available inventory unless confirmed by Homes Finder.",
      "Homes Finder makes no warranty regarding the accuracy or completeness of information and reserves the right to update content at any time.",
      "Nothing on this website constitutes financial, legal or investment advice.",
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    body: [
      "This website may use cookies and similar technologies to improve your browsing experience and understand how the site is used.",
      "You can control or delete cookies through your browser settings. Disabling cookies may affect some functionality.",
    ],
  },
  "real-estate-disclaimer": {
    title: "Real Estate Disclaimer",
    body: [
      "All property information, images, prices and specifications on this website are provided for general guidance and may change without notice.",
      "Demo properties are clearly labelled and are used for demonstration purposes only until actual company listings are added.",
      "Prospective buyers and tenants should independently verify all details before entering into any transaction.",
    ],
  },
  "investment-disclaimer": {
    title: "Investment Disclaimer",
    body: [
      "Property values, rental yields, capital appreciation and investment returns are not guaranteed and depend on market conditions.",
      "Any figures, calculators or projections presented on this website are indicative and for illustration only. They do not constitute financial or investment advice.",
      "You should seek independent professional advice before making any property investment decision.",
    ],
  },
};

export default function Legal() {
  const { slug } = useParams();
  const page = CONTENT[slug] || CONTENT["privacy-policy"];
  return (
    <div data-testid="legal-page">
      <SEO title={`${page.title} | Homes Finder`} description={`${page.title} for Homes Finder UAE real estate advisory.`} path={`/legal/${slug}`} />
      <Section>
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl font-bold text-slate-900" data-testid="legal-title">{page.title}</h1>
          <div className="mt-8 space-y-5">
            {page.body.map((p, i) => <p key={i} className="text-slate-700 leading-relaxed">{p}</p>)}
          </div>
        </div>
      </Section>
    </div>
  );
}
