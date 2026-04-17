import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import seedItems from "./data/groceries.json";
import { GroceryItem, GrocerySeedItem, GrocerySeedPayload, MonthSnapshot } from "./types";
import { itemSubtotal, monthLabelFromDate } from "./utils";

type AppState = {
  items: GroceryItem[];
  monthlyBudget: number;
  history: MonthSnapshot[];
  hasSeeded: boolean;
  seedSignature: string | null;
  initializeSeed: () => void;
  setMonthlyBudget: (value: number) => void;
  updateItem: (id: string, patch: Partial<GroceryItem>) => void;
  addItem: (item: GrocerySeedItem) => void;
  closeMonth: () => void;
  resetForNewMonth: () => void;
};

const withId = (item: GrocerySeedItem): GroceryItem => ({
  ...item,
  id: `${item.englishName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  purchased: false,
});

const flattenSeedPayload = (payload: GrocerySeedPayload): GrocerySeedItem[] => {
  return payload.categories.flatMap((category) =>
    category.items.map((item) => ({
      englishName: item.label_en,
      urduName: item.label_ur,
      category: category.label_en,
      unit: item.unit,
      quantity: item.qty,
      unitPrice: item.price_per_unit,
    })),
  );
};

const seedItemKey = (item: GrocerySeedItem) =>
  `${item.category}::${item.englishName.toLowerCase()}::${item.urduName.toLowerCase()}`;

const mergeMissingSeedItems = (existingItems: GroceryItem[], seedList: GrocerySeedItem[]) => {
  const existingKeys = new Set(existingItems.map(seedItemKey));
  const missingSeedItems = seedList.filter((seedItem) => !existingKeys.has(seedItemKey(seedItem))).map(withId);
  return [...existingItems, ...missingSeedItems];
};

export const useKharchaStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      monthlyBudget: 60000,
      history: [],
      hasSeeded: false,
      seedSignature: null,
      initializeSeed: () => {
        const payload = seedItems as GrocerySeedPayload;
        const nextSeedSignature = `${payload.version}:${payload.last_updated}`;
        const nextSeedList = flattenSeedPayload(payload);
        const { hasSeeded, seedSignature, items } = get();

        if (hasSeeded && seedSignature === nextSeedSignature) {
          return;
        }

        const nextItems = hasSeeded ? mergeMissingSeedItems(items, nextSeedList) : nextSeedList.map(withId);
        set({
          items: nextItems,
          hasSeeded: true,
          seedSignature: nextSeedSignature,
        });
      },
      setMonthlyBudget: (value) => set({ monthlyBudget: Number.isNaN(value) ? 0 : value }),
      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addItem: (item) => set((state) => ({ items: [...state.items, withId(item)] })),
      closeMonth: () => {
        const { items, history } = get();
        const spentItems = items.filter((item) => item.purchased);
        const snapshot: MonthSnapshot = {
          id: `month-${Date.now()}`,
          monthLabel: monthLabelFromDate(),
          closedAt: new Date().toISOString(),
          totalSpent: spentItems.reduce((sum, item) => sum + itemSubtotal(item), 0),
          items: spentItems,
        };
        set({ history: [snapshot, ...history] });
      },
      resetForNewMonth: () =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, purchased: false })),
        })),
    }),
    {
      name: "kharcha-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        monthlyBudget: state.monthlyBudget,
        history: state.history,
        hasSeeded: state.hasSeeded,
        seedSignature: state.seedSignature,
      }),
    },
  ),
);
