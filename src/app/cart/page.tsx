"use client";

import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, MapPin, CreditCard, CheckCircle2, Zap } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Payment, 4: Done

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setStep(2);
    }
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-orange-50 p-8 rounded-[40px] mb-8">
          <ShoppingBag className="h-24 w-24 text-[var(--color-primary-gold)]" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 italic uppercase">Your Cart is Empty</h1>
        <p className="text-slate-400 font-bold mb-8">Looks like you haven't added any groceries yet.</p>
        <Link 
          href="/"
          className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black ${step >= s ? 'bg-[var(--color-primary-gold)] text-slate-900 shadow-lg' : 'bg-white text-slate-300'}`}>
                {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
              </div>
              {s < 3 && <div className={`h-1 flex-1 mx-4 rounded-full ${step > s ? 'bg-[var(--color-primary-gold)]' : 'bg-white'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {step === 1 && (
               <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                 <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                   <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 italic uppercase">
                     <ShoppingBag className="h-6 w-6 text-[var(--color-primary-gold)]" />
                     Your Selection ({totalItems})
                   </h2>
                   <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1">
                     <ChevronLeft className="h-4 w-4" />
                     Back to Shop
                   </Link>
                 </div>
                 <div className="divide-y divide-gray-50">
                    {cart.map((item) => (
                      <div key={item.id} className="p-8 flex items-center gap-6">
                        <div className="h-24 w-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                           {/* Placeholder for real images */}
                           <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary-gold)] font-black text-2xl uppercase italic opacity-20">Fresh</div>
                        </div>
                        <div className="flex-1">
                           <h3 className="font-black text-slate-900 mb-1">{item.name}</h3>
                           <p className="text-sm font-bold text-slate-400 mb-4">{item.category}</p>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 hover:text-[var(--color-primary-gold)] transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-black text-slate-900">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 hover:text-[var(--color-primary-gold)] transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-slate-900 text-lg">₹{(item.price * item.quantity).toLocaleString()}</p>
                           <p className="text-xs font-bold text-slate-400">₹{item.price.toLocaleString()} / unit</p>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
                 <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 italic uppercase">
                   <MapPin className="h-6 w-6 text-[var(--color-primary-gold)]" />
                   Delivery Address
                 </h2>
                 <div className="space-y-6">
                    <div className="p-6 border-2 border-[var(--color-primary-gold)] bg-orange-50/50 rounded-2xl relative">
                       <div className="absolute top-4 right-4 h-6 w-6 bg-[var(--color-primary-gold)] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-slate-900" />
                       </div>
                       <h3 className="font-black text-slate-900 mb-2 italic uppercase">Home</h3>
                       <p className="text-slate-600 font-medium">123, Vitzo Towers, Indiranagar<br/>Bangalore, KA 560038</p>
                    </div>
                    <button className="w-full p-6 border-2 border-dashed border-gray-100 rounded-2xl font-black text-slate-400 hover:border-[var(--color-primary-gold)] hover:text-[var(--color-primary-gold)] transition-all">
                       + Add New Address
                    </button>
                 </div>
                 <div className="mt-12 flex justify-between">
                    <button onClick={() => setStep(1)} className="font-black text-slate-400 hover:text-slate-900">Back</button>
                    <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">Continue to Payment</button>
                 </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
                 <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 italic uppercase">
                   <CreditCard className="h-6 w-6 text-[var(--color-primary-gold)]" />
                   Payment Method
                 </h2>
                 <div className="space-y-6">
                    <div className="p-6 border-2 border-[var(--color-primary-gold)] bg-orange-50/50 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                             <CreditCard className="h-6 w-6 text-[var(--color-primary-gold)]" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 italic uppercase">Default Card</h3>
                            <p className="text-slate-600 font-medium">•••• •••• •••• 1234</p>
                          </div>
                       </div>
                       <div className="h-6 w-6 bg-[var(--color-primary-gold)] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-slate-900" />
                       </div>
                    </div>
                    <div className="p-6 border-2 border-gray-50 rounded-2xl flex items-center justify-between opacity-50 grayscale cursor-not-allowed">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                             <Zap className="h-6 w-6 text-purple-500" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 italic uppercase">UPI (Coming Soon)</h3>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="mt-12 flex justify-between">
                    <button onClick={() => setStep(2)} className="font-black text-slate-400 hover:text-slate-900">Back</button>
                    <button onClick={() => setStep(4)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">Place Order</button>
                 </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 p-12 text-center">
                 <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 mb-4 italic uppercase tracking-tighter">Order Success!</h2>
                 <p className="text-slate-400 font-bold mb-12 max-w-sm mx-auto">Your fresh groceries will be delivered in the evening batch today.</p>
                 <div className="flex flex-col gap-4">
                    <Link href="/" className="bg-[var(--color-primary-gold)] text-slate-900 px-10 py-5 rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">Track Order</Link>
                    <Link href="/" className="font-black text-slate-400 hover:text-slate-900">Back to Shop</Link>
                 </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          {step < 4 && (
            <div className="lg:col-span-4">
              <div className="bg-slate-900 rounded-[32px] p-8 text-white sticky top-24 shadow-2xl shadow-slate-200">
                <h3 className="text-xl font-black mb-8 italic uppercase text-[var(--color-primary-gold)]">Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>Delivery</span>
                    <span className="text-[var(--color-secondary-green)]">FREE</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>Taxes</span>
                    <span>₹{(totalPrice * 0.05).toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-[1px] bg-white/10 mb-8" />
                <div className="flex justify-between items-end mb-12">
                   <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Payable</p>
                      <p className="text-3xl font-black italic tracking-tighter">₹{(totalPrice * 1.05).toLocaleString()}</p>
                   </div>
                </div>
                {step === 1 && (
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-[var(--color-primary-gold)] text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                  >
                    Checkout Now
                  </button>
                )}
                <p className="text-center text-[10px] uppercase font-black tracking-widest text-slate-500 mt-6">
                  Secured by Vitzo SSL
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
