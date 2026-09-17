import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { waLink } from "@/components/FloatingWhatsApp";
import { WHATSAPP_MESSAGES } from "@/data/site";

export default function CTASection({
  title = "Looking for the Right Property Opportunity?",
  text = "Whether you are buying your first home, selling an existing property, searching for a rental or evaluating an investment opportunity, our team is ready to help.",
  waContext = "general",
}) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const number = settings?.contact?.whatsapp || "971501184777";

  return (
    <section className="bg-slate-900 relative overflow-hidden" data-testid="cta-section">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #C5A059 0%, transparent 50%)" }} />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{title}</h2>
        <p className="mt-5 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">{text}</p>
        <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate("/contact")} data-testid="cta-book-consultation" className="px-8 py-6 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-base rounded-full">
            Book a Consultation
          </Button>
          <a href={waLink(number, WHATSAPP_MESSAGES[waContext] || WHATSAPP_MESSAGES.general)} target="_blank" rel="noopener noreferrer" data-testid="cta-whatsapp-advisor">
            <Button variant="outline" className="px-8 py-6 border-white/30 bg-transparent text-white hover:bg-white hover:text-slate-950 font-semibold text-base rounded-full w-full">
              <MessageCircle className="h-5 w-5 mr-2" /> WhatsApp an Advisor
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
