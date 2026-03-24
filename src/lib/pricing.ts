export type WeightUnit = "g" | "kg";

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function weightToGrams(value: number, unit: WeightUnit) {
  return unit === "kg" ? Math.round(value * 1000) : Math.round(value);
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
