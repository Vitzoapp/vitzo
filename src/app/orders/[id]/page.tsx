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

  const [rating, setRating] = useState(0);
  const [_comment, _setComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error: _error } = await supabase
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

      if (data) setOrder(data);
      setLoading(false);
    };

    if (id) {
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
    }
  }, [id]);

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

    if (!error) setHasRated(true);
    setSubmittingRating(false);
  };

  if (loading) return <div className="min-h-screen bg-white"><div className="p-20 animate-pulse bg-gray-50 h-screen" /></div>;
  if (!order) return <div className="min-h-screen bg-white flex items-center justify-center"><p>Order not found</p></div>;

  const steps = [
    { label: 'Confirmed', status: 'pending', description: 'Agent will be assigned shortly', icon: CheckCircle2 },
    { label: 'Agent Assigned', status: 'assigned', description: order.agents?.full_name || 'Finding best agent', icon: User },
    { label: 'Out for Delivery', status: 'out_for_delivery', description: 'Order on its way', icon: Truck },
    { label: 'Delivered', status: 'delivered', description: 'Enjoy your products', icon: Package }
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.delivery_status);

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
                      </div>
                    );
                  })}
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
