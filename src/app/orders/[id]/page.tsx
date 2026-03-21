"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Package, 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  Truck, 
  Clock, 
  User
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  delivery_status: string;
  delivery_pin: string;
  shipping_house_no: string;
  shipping_street: string;
  shipping_area: string;
  mobile_number: string;
  agent_id?: string;
  agents?: {
    full_name: string;
    phone_number: string;
    average_rating: number;
  };
  order_items: {
    id: string;
    quantity: number;
    price_at_time_of_order: number;
    products: {
      name: string;
      image_url: string;
    };
  }[];
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [rating, setRating] = useState(0);
  const [_comment, _setComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          agents (full_name, phone_number, average_rating),
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Order Fetch Error:", error);
        setErrorStatus(error.code === 'PGRST116' ? 404 : 403);
      } else {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();

    const subscription = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, 
      (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new as unknown as Order } : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, router]);

  useEffect(() => {
    const checkRating = async () => {
      if (order?.id && order.delivery_status === 'delivered') {
        const { data } = await supabase
          .from('agent_ratings')
          .select('*')
          .eq('order_id', order.id)
          .single();
        if (data) setHasRated(true);
      }
    };
    checkRating();
  }, [order?.id, order?.delivery_status]);

  const handleRate = async () => {
    if (rating === 0) return;
    setSubmittingRating(true);
    const { error } = await supabase
      .from('agent_ratings')
      .insert([{
        order_id: order?.id,
        agent_id: order?.agent_id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        rating,
        comment: _comment
      }]);

    if (error) {
      console.error("Error submitting rating:", error);
      alert("Could not submit rating. Please try again.");
    } else {
      setHasRated(true);
    }
    setSubmittingRating(false);
  };

  if (loading) return <div className="min-h-screen bg-white"><div className="p-20 animate-pulse bg-gray-50 h-screen" /></div>;
  if (!order) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
      <div className={`h-24 w-24 rounded-[32px] flex items-center justify-center mb-8 ${errorStatus === 403 ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}`}>
        <Package className="h-12 w-12" />
      </div>
      <h2 className="font-outfit text-4xl font-black text-slate-950 uppercase tracking-tighter italic mb-4">
        {errorStatus === 403 ? "Access" : "Order"} <span className={errorStatus === 403 ? "text-amber-500" : "text-red-500"}>{errorStatus === 403 ? "Denied" : "Not Found"}</span>
      </h2>
      <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
        {errorStatus === 403 
          ? "You don't have permission to view this order. Please ensure you are logged into the correct account." 
          : "We couldn't find an order with this ID. It might be incorrect or has been removed."}
      </p>
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => router.push('/orders')}
          className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest italic text-sm hover:bg-[var(--color-primary-green)] transition-all shadow-xl"
        >
          View My Orders
        </button>
        {errorStatus === 403 && (
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] italic">Code: ERR_ACCESS_RESTRICTED</p>
        )}
      </div>
    </div>
  );

  const steps = [
    { label: 'Confirmed', status: 'pending', description: 'Order received and being processed', icon: CheckCircle2, subText: 'Estimated: 5 mins' },
    { label: 'Agent Assigned', status: 'assigned', description: order.agents?.full_name ? `Agent ${order.agents.full_name} is at store` : 'Finding best agent nearby', icon: User, subText: 'Estimated: 10 mins' },
    { label: 'Out for Delivery', status: 'out_for_delivery', description: 'Order on its way to you', icon: Truck, subText: 'Arrival in 15 mins' },
    { label: 'Delivered', status: 'delivered', description: 'Enjoy your products!', icon: Package, subText: 'Completed' }
  ];

  const currentStatusIndex = steps.findIndex(s => s.status === order.delivery_status);
  const currentStepIndex = currentStatusIndex === -1 ? 0 : currentStatusIndex;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-20">
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-bold uppercase tracking-widest text-xs">Orders History</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Tracking Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                  <h1 className="font-outfit text-3xl font-black text-slate-950 uppercase tracking-tighter italic">Tracking Order</h1>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1 italic">Order ID: {order.id.slice(0, 8)}</p>
                </div>
                {order.delivery_status === 'out_for_delivery' && order.delivery_pin && (
                  <div className="bg-[var(--color-primary-green)] text-white p-4 rounded-3xl shadow-xl animate-bounce">
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-80 text-center">PIN</span>
                    <span className="text-3xl font-black tracking-[0.2em]">{order.delivery_pin}</span>
                  </div>
                )}
              </div>

              {/* Progress Tracker */}
              <div className="relative pt-8 pb-12">
                <div className="absolute top-[3.75rem] left-8 right-8 h-1 bg-gray-100 rounded-full" />
                <div 
                  className="absolute top-[3.75rem] left-8 h-1 bg-[var(--color-primary-green)] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />

                <div className="relative flex justify-between">
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step.label} className="flex flex-col items-center">
                        <div className={`h-16 w-16 rounded-[22px] flex items-center justify-center transition-all duration-500 z-10 ${
                          isCurrent ? 'bg-[var(--color-primary-green)] text-white shadow-xl scale-110' :
                          isActive ? 'bg-slate-900 text-white' : 'bg-white border border-gray-100 text-slate-300'
                        }`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <h4 className={`mt-4 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                          isActive ? 'text-slate-900' : 'text-slate-300'
                        }`}>{step.label}</h4>
                        <span className={`mt-1 text-[8px] font-bold uppercase tracking-widest ${
                          isCurrent ? 'text-[var(--color-primary-green)]' : 'text-slate-400'
                        }`}>{step.subText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Status Info Card */}
              <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[var(--color-primary-green)]">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Status Insight</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">{steps[currentStepIndex].description}</p>
                  {order.delivery_status !== 'delivered' && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[var(--color-primary-green)] animate-ping" />
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Live Updates Enabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Items */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 leading-none">
               <h3 className="font-outfit text-xl font-black text-slate-950 uppercase tracking-tighter italic mb-6">Delivery Items</h3>
               <div className="space-y-4">
                 {order.order_items.map((item) => (
                   <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                     <div className="flex items-center gap-4">
                       <div className="h-16 w-16 relative rounded-xl overflow-hidden bg-white shadow-sm border">
                         <Image src={item.products.image_url} alt={item.products.name} fill className="object-cover" />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900">{item.products.name}</h4>
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Qty: {item.quantity}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-lg font-black text-slate-950 tracking-tighter italic">₹{item.price_at_time_of_order.toLocaleString("en-IN")}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Rating Section */}
            {order.delivery_status === 'delivered' && !hasRated && (
              <div className="bg-white rounded-[40px] p-8 border border-[var(--color-primary-green)]/20 shadow-xl shadow-[var(--color-primary-green)]/5">
                <h3 className="font-outfit text-xl font-black text-slate-950 uppercase tracking-tighter italic mb-4 text-center">Rate Agent</h3>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setRating(s)}
                      className={`h-10 w-10 transition-all ${rating >= s ? 'text-amber-400 scale-110' : 'text-slate-200'}`}
                    >
                      <Star className={`h-8 w-8 ${rating >= s ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <textarea 
                  value={_comment}
                  onChange={(e) => _setComment(e.target.value)}
                  placeholder="Share your delivery experience..."
                  className="w-full h-24 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:bg-white focus:border-[var(--color-primary-green)] outline-none mb-6 resize-none"
                />
                <button 
                  onClick={handleRate}
                  disabled={submittingRating || rating === 0}
                  className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[var(--color-primary-green)] disabled:bg-slate-300 transition-all"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
            
            {hasRated && (
              <div className="bg-green-50 rounded-[40px] p-8 border border-green-100 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
                <h3 className="font-black text-slate-900 uppercase italic">Feedback Received</h3>
              </div>
            )}

            {/* Agent Info */}
            {order.agents ? (
              <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><User className="h-24 w-24" /></div>
                <h3 className="font-outfit text-xl font-black uppercase tracking-tighter italic mb-6">Agent</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center"><User className="h-8 w-8 text-[var(--color-primary-green)]" /></div>
                  <div>
                    <h4 className="font-bold text-lg">{order.agents.full_name}</h4>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-black">{order.agents.average_rating || '5.0'}</span>
                    </div>
                  </div>
                </div>
                <a href={`tel:${order.agents.phone_number}`} className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--color-primary-green)] rounded-xl font-black uppercase tracking-widest text-xs">
                  <Phone className="h-4 w-4" /> Call Agent
                </a>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-[40px] p-8 border border-amber-100 text-center">
                <Clock className="h-12 w-12 text-amber-500 mb-4 animate-pulse mx-auto" />
                <h3 className="font-black text-slate-900 uppercase italic">Assigning Agent</h3>
              </div>
            )}

            <div className="bg-white rounded-[40px] p-8 border border-gray-100">
              <h3 className="font-outfit text-xl font-black text-slate-950 uppercase tracking-tighter italic mb-6">Delivery to</h3>
              <div className="flex gap-4">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900">{order.shipping_house_no}, {order.shipping_street}</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{order.shipping_area}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
