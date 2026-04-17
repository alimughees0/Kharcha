import { Category, GroceryItem } from "./types";

export const money = (value: number) => `Rs ${value.toFixed(0)}`;

export const itemSubtotal = (item: GroceryItem) => (item.quantity ?? 0) * (item.unitPrice ?? 0);

export const monthLabelFromDate = (date = new Date()) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const categoryTotals = (items: GroceryItem[]) => {
  return items.reduce<Record<Category, number>>((acc, item) => {
    if (!item.purchased) {
      return acc;
    }

    acc[item.category] = (acc[item.category] ?? 0) + itemSubtotal(item);
    return acc;
  }, {} as Record<Category, number>);
};
