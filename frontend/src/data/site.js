export const EMIRATES = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
];

export const COMMUNITIES = {
  Dubai: [
    "Downtown Dubai", "Dubai Marina", "Business Bay", "Jumeirah", "Palm Jumeirah",
    "Arabian Ranches", "Dubai Hills", "JVC", "Jumeirah Lake Towers", "Dubai Creek Harbour",
  ],
  "Abu Dhabi": ["Yas Island", "Saadiyat Island", "Al Reem Island", "Al Raha Beach"],
  Sharjah: ["Al Majaz", "Aljada", "Tilal City"],
  Ajman: ["Al Nuaimiya", "Emirates City"],
  "Ras Al Khaimah": ["Al Hamra Village", "Al Marjan Island"],
  Fujairah: ["Al Faseel", "Dibba"],
  "Umm Al Quwain": ["Al Salamah"],
};

export const PROPERTY_TYPES = [
  "Apartment", "Villa", "Townhouse", "Penthouse", "Land",
  "Office", "Retail", "Warehouse", "Staff Accommodation",
];

export const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4", "5", "6+"];

export const FEATURED_FILTERS = [
  { key: "all", label: "All" },
  { key: "buy", label: "Buy", field: "purpose", value: "buy" },
  { key: "rent", label: "Rent", field: "purpose", value: "rent" },
  { key: "residential", label: "Residential", field: "category", value: "residential" },
  { key: "commercial", label: "Commercial", field: "category", value: "commercial" },
  { key: "offplan", label: "Off-Plan", field: "status", value: "offplan" },
];

export const CATEGORY_CARDS = [
  { title: "Buy", desc: "Find your ideal home or investment property.", to: "/buy", key: "buy" },
  { title: "Sell", desc: "Maximise your property's market potential with professional advisory.", to: "/sell", key: "sell" },
  { title: "Rent", desc: "Discover residential and commercial rental opportunities.", to: "/rent", key: "rent" },
  { title: "Invest", desc: "Identify income-generating and capital-growth opportunities.", to: "/invest", key: "invest" },
  { title: "Off-Plan", desc: "Explore carefully selected developer opportunities.", to: "/off-plan", key: "offplan" },
  { title: "Commercial", desc: "Office, retail, warehouse, land and commercial investment opportunities.", to: "/commercial", key: "commercial" },
];

export const WHATSAPP_MESSAGES = {
  buy: "Hello Homes Finder, I am interested in buying a property.",
  sell: "Hello Homes Finder, I would like to sell my property.",
  rent: "Hello Homes Finder, I am looking for a rental property.",
  invest: "Hello Homes Finder, I would like to discuss a property investment.",
  general: "Hello Homes Finder, I would like to know more about your services.",
};
