export type WeightUnit = "g" | "kg" | "ml" | "l" | "pack" | "piece";
export type ProductUnitType = "weight" | "volume" | "discrete";

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function weightToGrams(value: number, unit: WeightUnit) {
  if (unit === "kg" || unit === "l") {
    return Math.round(value * 1000);
  }

  return Math.round(value);
}

export function formatWeightLabel(weightInGrams: number) {
  if (weightInGrams >= 1000 && weightInGrams % 1000 === 0) {
    return `${weightInGrams / 1000}kg`;
  }

  return `${weightInGrams}g`;
}

export function calculateWeightedPrice(pricePerKg: number, weightInGrams: number) {
  return roundCurrency((pricePerKg * weightInGrams) / 1000);
}

export function calculateWeightedCommission(commissionPerKg: number, weightInGrams: number) {
  return roundCurrency((commissionPerKg * weightInGrams) / 1000);
}

export function buildCartLineId(productId: string, weightInGrams: number) {
  return `${productId}:${weightInGrams}`;
}

export function formatSelectionLabel(value: number, unit: WeightUnit) {
  if (unit === "kg" || unit === "l") {
    const normalizedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    return `${normalizedValue}${unit}`;
  }

  return `${Math.round(value)}${unit}`;
}

export function getUnitPriceLabel(unit: WeightUnit) {
  if (unit === "ml" || unit === "l") {
    return "/ l";
  }

  if (unit === "pack") {
    return "/ pack";
  }

  if (unit === "piece") {
    return "/ piece";
  }

  return "/ kg";
}

export function getDefaultUnitsForProductType(unitType: ProductUnitType): WeightUnit[] {
  if (unitType === "volume") {
    return ["ml", "l"];
  }

  if (unitType === "discrete") {
    return ["pack", "piece"];
  }

  return ["g", "kg"];
}

export function normalizeAllowedUnitsForProduct(
  value: unknown,
  unitType: ProductUnitType | string | null | undefined,
): WeightUnit[] {
  const normalizedUnitType = normalizeProductUnitType(unitType);
  const defaults = getDefaultUnitsForProductType(normalizedUnitType);

  if (!Array.isArray(value)) {
    return defaults;
  }

  const units = value.filter((item): item is WeightUnit =>
    item === "g" ||
    item === "kg" ||
    item === "ml" ||
    item === "l" ||
    item === "pack" ||
    item === "piece",
  );

  if (units.length === 0) {
    return defaults;
  }

  const sameFamilyUnits = units.filter((unit) => defaults.includes(unit));
  return sameFamilyUnits.length > 0 ? sameFamilyUnits : defaults;
}

export function normalizeProductUnitType(
  unitType: ProductUnitType | string | null | undefined,
): ProductUnitType {
  if (unitType === "volume" || unitType === "discrete") {
    return unitType;
  }

  return "weight";
}
