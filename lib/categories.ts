export type Category = {
  value: string;
  label: string;
  emoji: string;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { value: "grocery", label: "Grocery", emoji: "🛒" },
  { value: "bills", label: "Bills/Ghar", emoji: "🏠" },
  { value: "bachay", label: "Bachay", emoji: "🧒" },
  { value: "safar", label: "Safar", emoji: "🚗" },
  { value: "sehat", label: "Sehat", emoji: "💊" },
  { value: "khana", label: "Khana", emoji: "🍔" },
  { value: "baqi", label: "Baqi", emoji: "🎁" },
];

export const INCOME_CATEGORIES: Category[] = [
  { value: "tankhwah", label: "Tankhwah", emoji: "💼" },
  { value: "extra_kaam", label: "Extra Kaam", emoji: "💰" },
  { value: "tohfa", label: "Tohfa", emoji: "🎉" },
];

const CATEGORY_MAP = new Map(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.value, c]),
);

export function getCategoryMeta(value: string): Category {
  return CATEGORY_MAP.get(value) ?? { value, label: value, emoji: "🔖" };
}
