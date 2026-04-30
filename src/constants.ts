import { Category, Unit } from "./types";

export const CATEGORIES: Category[] = [
  "Kitchen",
  "Bakery",
  "Pulses & Legumes",
  "Spices",
  "Dry Fruits",
  "Cleaning",
  "Personal",
  "Medicines",
  "Extras",
];

export const UNITS: Unit[] = ["kg", "g", "ltr", "pcs", "pack", "bottle", "jar", "loaf", "tube"];

export const CATEGORY_URDU_LABELS: Record<Category, string> = {
  Kitchen: "باورچی خانہ",
  Bakery: "بیکری",
  "Pulses & Legumes": "دالیں",
  Spices: "مصالحہ جات",
  "Dry Fruits": "خشک میوہ جات",
  Cleaning: "صفائی",
  Personal: "ذاتی",
  Medicines: "ادویات",
  Extras: "اضافی چیزیں",
};

export const COLORS = {
  primary: "#059669", // Emerald 600
  primaryLight: "#ecfdf5", // Emerald 50
  primaryDark: "#065f46", // Emerald 800
  background: "#f9fafb", // Slate 50
  card: "#ffffff",
  text: "#1e293b", // Slate 800
  muted: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  danger: "#ef4444", // Red 500
  accent: "#10b981", // Emerald 500
};
