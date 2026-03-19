"use client";

import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform transition-transform duration-500 ease-in-out">
          <div className="flex h-full flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-outfit text-xl font-bold text-slate-900">
                Shopping Cart ({totalItems})
              </h2>
              <button 
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <div className="rounded-full bg-gray-50 p-6">
                    <ShoppingBag className="h-12 w-12 text-slate-300" />
                  </div>
                  <p className="text-slate-500">Your cart is empty</p>
                  <button 
                    onClick={onClose}
                    className="font-bold text-[var(--color-primary-indigo)] hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <p className="font-bold text-slate-900">₹{item.price.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-bold text-slate-900">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-sm font-medium text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-6">
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Shipping and taxes calculated at checkout.
                </p>
                <div className="mt-6">
                  <button className="flex w-full items-center justify-center rounded-2xl bg-slate-900 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.98]">
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
