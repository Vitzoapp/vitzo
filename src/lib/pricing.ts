export type WeightUnit = "g" | "kg" | "ml" | "l" | "pack" | "piece";

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
