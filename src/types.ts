export type Category =
  | "Kitchen"
  | "Bakery"
  | "Pulses & Legumes"
  | "Spices"
  | "Dry Fruits"
  | "Cleaning"
  | "Personal"
  | "Medicines"
  | "Extras";

export type Unit =
  | "kg"
  | "g"
  | "ltr"
  | "pcs"
  | "pack"
  | "bottle"
  | "jar"
  | "loaf"
  | "tube";

export type GrocerySeedItem = {
  urduName: string;
  englishName: string;
  category: Category;
  unit: Unit;
  quantity: number | null;
  unitPrice: number | null;
};

export type GrocerySeedCategoryItem = {
  id: string;
  label_en: string;
  label_ur: string;
  unit: Unit;
  qty: number | null;
  price_per_unit: number | null;
  purchased: boolean;
};

export type GrocerySeedCategory = {
  id: string;
  label_en: Category;
  label_ur: string;
  items: GrocerySeedCategoryItem[];
};

export type GrocerySeedPayload = {
  version: string;
  last_updated: string;
  categories: GrocerySeedCategory[];
};

export type GroceryItem = GrocerySeedItem & {
  id: string;
  purchased: boolean;
};

export type MonthSnapshot = {
  id: string;
  monthLabel: string;
  closedAt: string;
  totalSpent: number;
  items: GroceryItem[];
};
