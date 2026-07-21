import {
  ShoppingCart,
  Home,
  Baby,
  Car,
  Pill,
  Utensils,
  ShoppingBag,
  GraduationCap,
  Clapperboard,
  Gift,
  Briefcase,
  Wallet,
  PartyPopper,
  Tag,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { value: "grocery", label: "Grocery", icon: ShoppingCart },
  { value: "bills", label: "Bills/Ghar", icon: Home },
  { value: "bachay", label: "Bachay", icon: Baby },
  { value: "safar", label: "Safar", icon: Car },
  { value: "sehat", label: "Sehat", icon: Pill },
  { value: "khana", label: "Khana", icon: Utensils },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "taleem", label: "Taleem", icon: GraduationCap },
  { value: "tafreeh", label: "Tafreeh", icon: Clapperboard },
  { value: "baqi", label: "Baqi", icon: Gift },
];

export const INCOME_CATEGORIES: Category[] = [
  { value: "tankhwah", label: "Tankhwah", icon: Briefcase },
  { value: "extra_kaam", label: "Extra Kaam", icon: Wallet },
  { value: "tohfa", label: "Tohfa", icon: PartyPopper },
];

const CATEGORY_MAP = new Map(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.value, c]),
);

export function getCategoryMeta(value: string): Category {
  return CATEGORY_MAP.get(value) ?? { value, label: value, icon: Tag };
}
