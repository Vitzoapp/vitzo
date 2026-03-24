import {
  Apple,
  Beef,
  Candy,
  Croissant,
  Fish,
  LucideIcon,
  Milk,
  Salad,
  Soup,
} from "lucide-react";

export function getCategoryVisual(slug: string, name: string): {
  icon: LucideIcon;
  tintClass: string;
} {
  const value = `${slug} ${name}`.toLowerCase();

  if (value.includes("fruit")) {
    return { icon: Apple, tintClass: "bg-[rgba(242,106,46,0.14)] text-[var(--accent-deep)]" };
  }

  if (value.includes("vegetable") || value.includes("veg")) {
    return { icon: Salad, tintClass: "bg-[rgba(125,207,89,0.16)] text-[var(--accent-fresh)]" };
  }

  if (value.includes("dairy") || value.includes("milk") || value.includes("egg")) {
    return { icon: Milk, tintClass: "bg-[rgba(255,216,77,0.18)] text-[var(--forest-950)]" };
  }

  if (value.includes("bakery") || value.includes("bread")) {
    return { icon: Croissant, tintClass: "bg-[rgba(244,196,126,0.22)] text-[var(--forest-950)]" };
  }

  if (value.includes("meat") || value.includes("chicken")) {
    return { icon: Beef, tintClass: "bg-[rgba(184,79,74,0.16)] text-[rgb(130,44,40)]" };
  }

  if (value.includes("seafood") || value.includes("fish")) {
    return { icon: Fish, tintClass: "bg-[rgba(87,166,214,0.16)] text-[rgb(34,101,143)]" };
  }

  if (value.includes("snack")) {
    return { icon: Candy, tintClass: "bg-[rgba(255,156,168,0.16)] text-[rgb(173,73,90)]" };
  }

  if (value.includes("pantry") || value.includes("grocery")) {
    return { icon: Soup, tintClass: "bg-[rgba(255,216,77,0.18)] text-[var(--accent-deep)]" };
  }

  return { icon: Salad, tintClass: "bg-[rgba(125,207,89,0.14)] text-[var(--forest-950)]" };
}
