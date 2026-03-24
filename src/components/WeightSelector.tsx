"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { WeightUnit } from "@/lib/pricing";
import {
  buildCartLineId,
  calculateWeightedPrice,
  formatSelectionLabel,
  weightToGrams,
} from "@/lib/pricing";
import { useCart } from "@/context/CartContext";

const PRESET_WEIGHTS = {
  g: [250, 500, 750],
  kg: [1, 2, 3],
  ml: [250, 500, 750],
  l: [1, 2, 3],
  pack: [1, 2, 3],
  piece: [1, 2, 3],
} as const;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface WeightSelectorProps {
  productId: string;
  productName: string;
  category: string;
  image: string;
  pricePerKg: number;
  allowedUnits?: WeightUnit[];
  compact?: boolean;
}

export default function WeightSelector({
  productId,
  productName,
  category,
  image,
  pricePerKg,
  allowedUnits = ["g", "kg"],
  compact = false,
}: WeightSelectorProps) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [unit, setUnit] = useState<WeightUnit>(allowedUnits[0] ?? "g");
  const [weightValue, setWeightValue] = useState<number>(getDefaultValueForUnit(allowedUnits[0] ?? "g"));

  const selectableUnits: WeightUnit[] = allowedUnits.length > 0 ? allowedUnits : ["g", "kg"];
  const unitSignature = allowedUnits.join("|");

  useEffect(() => {
    const nextSelectableUnits: WeightUnit[] = allowedUnits.length > 0 ? allowedUnits : ["g", "kg"];
    const nextUnit = nextSelectableUnits[0] ?? "g";
    setUnit(nextUnit);
    setWeightValue(getDefaultValueForUnit(nextUnit));
  }, [productId, unitSignature, allowedUnits]);

  const weightInGrams = weightToGrams(weightValue, unit);
  const lineId = buildCartLineId(productId, weightInGrams);
  const cartItem = cart.find((item) => item.id === lineId);
  const quantity = cartItem?.quantity ?? 0;
  const linePrice = calculateWeightedPrice(pricePerKg, weightInGrams);

  const setUnitSelection = (nextUnit: WeightUnit) => {
    setUnit(nextUnit);
    setWeightValue(getDefaultValueForUnit(nextUnit));
  };

  const addCurrentWeight = () => {
    addToCart({
      id: lineId,
      productId,
      name: productName,
      image,
      category,
      quantity: 1,
      unitPrice: linePrice,
      selectedUnit: unit,
      selectedWeightValue: weightValue,
      weightInGrams,
    });
  };

  const increment = () => {
    if (quantity === 0) {
      addCurrentWeight();
      return;
    }

    updateQuantity(lineId, quantity + 1);
  };

  const decrement = () => {
    if (quantity <= 1) {
      removeFromCart(lineId);
      return;
    }

    updateQuantity(lineId, quantity - 1);
  };

  return (
    <div
      className={`space-y-4 ${
        compact ? "" : "rounded-[2rem] border border-[var(--line-soft)] bg-white/66 p-5"
      }`}
    >
      <div className="flex gap-2">
        {selectableUnits.map((nextUnit) => (
          <button
            key={nextUnit}
            type="button"
            onClick={() => setUnitSelection(nextUnit)}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold uppercase tracking-[0.18em] transition ${
              unit === nextUnit
                ? "bg-[var(--forest-950)] text-white"
                : "border border-[var(--line-soft)] bg-white text-[var(--forest-950)]"
            }`}
          >
            {nextUnit}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_WEIGHTS[unit].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setWeightValue(preset)}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
              weightValue === preset
                ? "bg-[var(--accent)] text-[var(--forest-950)]"
                : "border border-[var(--line-soft)] bg-white text-[var(--forest-950)]"
            }`}
          >
            {preset}
            {unit}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
            Selected weight
          </span>
          <input
            type="number"
            min={getMinValueForUnit(unit)}
            step={getStepForUnit(unit)}
            value={weightValue}
            onChange={(event) =>
              setWeightValue(
                Math.max(Number(event.target.value) || 0, getMinValueForUnit(unit)),
              )
            }
            className="mt-2 h-12 w-full rounded-full border border-[var(--line-soft)] bg-white px-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
          />
        </label>
        <div className="rounded-[1.4rem] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--forest-950)]">
          {currencyFormatter.format(linePrice)} for {formatSelectionLabel(weightValue, unit)}
        </div>
      </div>

      {quantity > 0 ? (
        <div className="flex min-h-12 items-center justify-between rounded-full border border-[var(--line-soft)] bg-white px-3">
          <button
            type="button"
            onClick={decrement}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--forest-950)] hover:bg-[var(--surface-soft)]"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-[var(--forest-950)]">
            {quantity} x {formatSelectionLabel(weightValue, unit)}
          </span>
          <button
            type="button"
            onClick={increment}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forest-950)] text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={addCurrentWeight}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-5 text-sm font-semibold text-white"
        >
          <ShoppingBag className="h-4 w-4" />
          Add {formatSelectionLabel(weightValue, unit)}
        </button>
      )}
    </div>
  );
}

function getDefaultValueForUnit(unit: WeightUnit) {
  return PRESET_WEIGHTS[unit][1] ?? PRESET_WEIGHTS[unit][0] ?? 1;
}

function getMinValueForUnit(unit: WeightUnit) {
  if (unit === "kg" || unit === "l") {
    return 0.1;
  }

  if (unit === "g" || unit === "ml") {
    return 50;
  }

  return 1;
}

function getStepForUnit(unit: WeightUnit) {
  if (unit === "kg" || unit === "l") {
    return 0.1;
  }

  if (unit === "g" || unit === "ml") {
    return 50;
  }

  return 1;
}
