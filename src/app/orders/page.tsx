"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_status: string;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: _error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'out_for_delivery': return <Truck className="h-5 w-5 text-blue-500" />;
      case 'assigned': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <Package className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-12 w-1.5 bg-slate-900 rounded-full" />
          <h1 className="font-outfit text-4xl font-black text-slate-950 uppercase tracking-tighter italic">
            Your Orders
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 w-full bg-white rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-gray-200">
            <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 uppercase italic">No orders yet</h2>
            <p className="text-slate-500 font-medium mt-2 mb-8">Ready to fill your kitchen with Vitzo freshness?</p>
            <Link 
              href="/"
              className="inline-flex h-12 px-8 items-center justify-center bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest italic text-sm hover:bg-[var(--color-primary-green)] transition-all shadow-xl"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Link 
                key={order.id} 
                href={`/orders/${order.id}`}
                className="block bg-white rounded-[32px] border border-gray-100 p-6 sm:p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group overflow-hidden relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--color-primary-green)]/10 group-hover:text-[var(--color-primary-green)] transition-colors">
                      {getStatusIcon(order.delivery_status || 'pending')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID: #{order.id.slice(0, 8)}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          order.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.delivery_status || 'Processing'}
                        </div>
                      </div>
                      <h3 className="font-outfit text-xl font-black text-slate-900 uppercase italic tracking-tight">
                        {order.order_items.length} {order.order_items.length === 1 ? 'Item' : 'Items'} Ordered
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-8 border-t sm:border-0 pt-4 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Amount</span>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter italic">
                        ₹{order.total_amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) }
      </main>
    </div>
  );
}
