import React from "react";
import { useSettings } from "@/context/SettingsContext";
import { MessageCircle } from "lucide-react";

export const waLink = (number, message) => {
  const n = (number || "971501184777").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(message || "")}`;
};

export default function FloatingWhatsApp({ message }) {
  const { settings } = useSettings();
  const number = settings?.contact?.whatsapp || "971501184777";

  return (
    <a
      href={waLink(number, message || "Hello Homes Finder, I would like to know more about your services.")}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="floating-whatsapp-btn"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-105 hover:bg-[#20bd5a]"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline font-semibold text-sm">WhatsApp Us</span>
    </a>
  );
}
