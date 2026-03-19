"use client";

import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, MapPin, CreditCard, CheckCircle2, Zap } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Payment, 4: Done
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");

  const ALLOWED_AREAS = ["Ramanattukara", "Azhinjilam", "Farook College"];

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    };

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) setProfile(data);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
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

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    // Save order to Supabase
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id,
        status: 'pending',
        total_amount: totalPrice * 1.05,
        shipping_address: profile?.address,
        shipping_area: profile?.area,
        mobile_number: profile?.mobile_number,
        payment_method: paymentMethod,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      alert("Error placing order: " + orderError.message);
      setLoading(false);
      return;
    }

    // Save order items
    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price_at_time_of_order: item.price
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      alert("Error saving order items: " + itemsError.message);
      setLoading(false);
      return;
    }

    clearCart();
    setStep(4);
    setLoading(false);
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-emerald-50 p-8 rounded-[40px] mb-8">
          <ShoppingBag className="h-24 w-24 text-[var(--color-primary-green)]" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 italic uppercase">Your Cart is Empty</h1>
        <p className="text-slate-400 font-bold mb-8">Looks like you haven&apos;t added any groceries yet.</p>
        <Link 
          href="/"
          className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const isAreaAllowed = profile?.area && ALLOWED_AREAS.includes(profile.area);

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-16 max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${step >= s ? 'bg-slate-900 text-white shadow-xl rotate-3' : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
                {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
              </div>
              {s < 3 && <div className={`h-1.5 flex-1 mx-4 rounded-full transition-all duration-700 ${step > s ? 'bg-slate-900 scale-x-100' : 'bg-white scale-x-0 origin-left'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {step === 1 && (
               <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
                 <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                   <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 italic uppercase">
                     <ShoppingBag className="h-6 w-6 text-[var(--color-primary-green)]" />
                     Your Selection ({totalItems})
                   </h2>
                   <Link href="/" className="text-sm font-black text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors">
                     <ChevronLeft className="h-4 w-4" />
                     Back to Shop
                   </Link>
                 </div>
                 <div className="divide-y divide-gray-50">
                    {cart.map((item) => (
                      <div key={item.id} className="p-10 flex items-center gap-8 group">
                        <div className="h-28 w-28 bg-slate-50 rounded-[32px] overflow-hidden flex-shrink-0 relative border-2 border-transparent group-hover:border-[var(--color-primary-green)] transition-all">
                           {item.image ? (
                             <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                             <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary-green)] font-black text-2xl uppercase italic opacity-20">Fresh</div>
                           )}
                        </div>
                        <div className="flex-1">
                           <h3 className="font-black text-lg text-slate-900 mb-1">{item.name}</h3>
                           <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-full">{item.category}</p>
                           <div className="flex items-center gap-6">
                              <div className="flex items-center bg-slate-900 rounded-2xl p-1 shadow-lg">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 text-white hover:text-[var(--color-primary-green)] transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-black text-white">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 text-white hover:text-[var(--color-primary-green)] transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-slate-900 text-2xl tracking-tighter italic">₹{(item.price * item.quantity).toLocaleString()}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">₹{item.price.toLocaleString()} / unit</p>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-gray-100 p-10">
                 <h2 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3 italic uppercase">
                   <MapPin className="h-6 w-6 text-[var(--color-primary-green)]" />
                   Delivery Address
                 </h2>
                 <div className="space-y-6">
                    {profile?.address ? (
                      <div className={`p-8 border-2 rounded-[32px] relative transition-all ${isAreaAllowed ? 'border-[var(--color-primary-green)] bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                        {isAreaAllowed ? (
                          <div className="absolute top-6 right-6 h-8 w-8 bg-[var(--color-primary-green)] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in duration-500">
                             <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="absolute top-6 right-6 h-8 w-8 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                             <MapPin className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <h3 className="font-black text-slate-900 mb-3 italic uppercase flex items-center gap-2">
                          Saved Address
                          {isAreaAllowed && <span className="text-[10px] bg-[var(--color-primary-green)] text-white px-2 py-0.5 rounded-full not-italic tracking-widest ml-2">Verified Area</span>}
                        </h3>
                        <p className="text-slate-600 font-bold leading-relaxed">{profile.address}</p>
                        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">{profile.area} | {profile.mobile_number}</p>
                        
                        {!isAreaAllowed && (
                          <div className="mt-6 p-4 rounded-2xl bg-white border border-red-100">
                             <p className="text-sm font-black text-red-500 italic">Sorry, we only deliver to {ALLOWED_AREAS.join(", ")} at the moment.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-10 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                        <p className="text-slate-400 font-bold mb-6">You haven&apos;t set a delivery address yet.</p>
                        <Link href="/profile" className="inline-flex bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
                          Setup Profile & Address
                        </Link>
                      </div>
                    )}
                 </div>
                 <div className="mt-12 flex justify-between items-center">
                    <button onClick={() => setStep(1)} className="font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs">Back</button>
                    {isAreaAllowed ? (
                      <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20">Continue to Payment</button>
                    ) : (
                      <Link href="/profile" className="bg-slate-200 text-slate-500 px-10 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Update Address</Link>
                    )}
                 </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-gray-100 p-10">
                 <h2 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3 italic uppercase">
                   <CreditCard className="h-6 w-6 text-[var(--color-primary-green)]" />
                   Payment Method
                 </h2>
                 <div className="space-y-6">
                    <button 
                      onClick={() => setPaymentMethod("cod")}
                      className={`w-full p-8 border-2 rounded-[32px] flex items-center justify-between transition-all text-left ${paymentMethod === "cod" ? 'border-[var(--color-primary-green)] bg-emerald-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                       <div className="flex items-center gap-6">
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === "cod" ? 'bg-[var(--color-primary-green)] text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                             <ShoppingBag className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 italic uppercase italic">Cash on Delivery</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Pay when you receive</p>
                          </div>
                       </div>
                       {paymentMethod === "cod" && <CheckCircle2 className="h-6 w-6 text-[var(--color-primary-green)]" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod("upi")}
                      className={`w-full p-8 border-2 rounded-[32px] flex items-center justify-between transition-all text-left ${paymentMethod === "upi" ? 'border-[var(--color-primary-green)] bg-emerald-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                       <div className="flex items-center gap-6">
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === "upi" ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                             <Zap className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 italic uppercase">Mock UPI Payment</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Instant confirmation</p>
                          </div>
                       </div>
                       {paymentMethod === "upi" && <CheckCircle2 className="h-6 w-6 text-[var(--color-primary-green)]" />}
                    </button>
                 </div>
                 <div className="mt-12 flex justify-between items-center">
                    <button onClick={() => setStep(2)} className="font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs">Back</button>
                    <button 
                      onClick={handlePlaceOrder} 
                      disabled={loading}
                      className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50 flex items-center gap-3"
                    >
                      {loading && <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Place Order (₹{(totalPrice * 1.05).toLocaleString()})
                    </button>
                 </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-[50px] shadow-2xl shadow-slate-200/50 border border-gray-100 p-16 text-center">
                 <div className="h-32 w-32 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 animate-bounce relative">
                    <CheckCircle2 className="h-16 w-16 text-[var(--color-primary-green)]" />
                    <div className="absolute -inset-4 bg-[var(--color-primary-green)]/10 rounded-[50px] -z-10 animate-pulse" />
                 </div>
                 <h2 className="text-5xl font-black text-slate-900 mb-4 italic uppercase tracking-tighter">Fresh Success!</h2>
                 <p className="text-slate-400 font-bold mb-16 max-w-sm mx-auto leading-relaxed">Your order has been received. We&apos;ll be at your doorstep during the evening batch today.</p>
                 <div className="flex flex-col gap-4 max-w-xs mx-auto">
                    <Link href="/" className="bg-[var(--color-primary-green)] text-white px-10 py-6 rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-emerald-200">Keep Shopping</Link>
                    <Link href="/profile" className="font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest text-xs py-4">View My Orders</Link>
                 </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          {step < 4 && (
            <div className="lg:col-span-4">
              <div className="bg-slate-900 rounded-[40px] p-10 text-white sticky top-24 shadow-2xl shadow-slate-300">
                <h3 className="text-xl font-black mb-10 italic uppercase text-[var(--color-primary-green)] tracking-widest">Order Summary</h3>
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span className="text-xs uppercase tracking-widest">Subtotal</span>
                    <span className="italic">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span className="text-xs uppercase tracking-widest">Delivery</span>
                    <span className="text-[var(--color-primary-green)] font-black italic">FREE</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span className="text-xs uppercase tracking-widest">Handling Fee</span>
                    <span className="italic">₹{(totalPrice * 0.05).toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-[1px] bg-white/10 mb-10" />
                <div className="flex justify-between items-end mb-12">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Total Amount</p>
                      <p className="text-4xl font-black italic tracking-tighter text-white">₹{(totalPrice * 1.05).toLocaleString()}</p>
                   </div>
                </div>
                {step === 1 && (
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-[var(--color-primary-green)] text-white py-6 rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/20"
                  >
                    Proceed to Payment
                  </button>
                )}
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-4 grayscale opacity-30">
                   <div className="h-6 w-auto border-r border-white/20 pr-4 flex items-center justify-center font-black text-[10px] italic">SSL SECURE</div>
                   <div className="font-black text-[10px] italic">VITZO PAY</div>
                </div>
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
