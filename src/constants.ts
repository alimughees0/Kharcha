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
  primary: "#2f855a",
  primaryLight: "#e6f4ec",
  background: "#f8fffb",
  card: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#d1fae5",
  danger: "#dc2626",
};
