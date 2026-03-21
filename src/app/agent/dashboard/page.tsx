"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  Truck, 
  Clock, 
  DollarSign, 
  LogOut,
  Navigation,
  ExternalLink,
  ShieldCheck,
  ToggleLeft as ToggleIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  delivery_status: string;
  shipping_house_no: string;
  shipping_street: string;
  shipping_area: string;
  mobile_number: string;
  order_items: {
    id: string;
    quantity: number;
    products: {
      name: string;
    }
  }[];
}

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchAgentData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!agentData || agentData.status !== 'approved') {
        router.push("/agent/register");
        return;
      }

      setAgent(agentData);
      
      // Fetch orders for this agent
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name)
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (ordersData) setOrders(ordersData);
      setLoading(false);
    };

    fetchAgentData();

    // Subscribe to new orders (simulating auto-assignment logic in a real app)
    const subscription = supabase
      .channel('agent-orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, 
      (payload) => {
        if (payload.new.agent_id === agent?.id) {
          setOrders(prev => {
            const index = prev.findIndex(o => o.id === payload.new.id);
            if (index > -1) {
              const newOrders = [...prev];
              newOrders[index] = { ...newOrders[index], ...payload.new };
              return newOrders;
            }
            return [payload.new as Order, ...prev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [router, agent?.id]);

  const toggleActive = async () => {
    setIsUpdating(true);
    const { data, error } = await supabase
      .from('agents')
      .update({ is_active: !agent.is_active })
      .eq('id', agent.id)
      .select()
      .single();

    if (data) setAgent(data);
    setIsUpdating(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: status })
      .eq('id', orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: status } : o));
    }
  };

  if (loading) return <div className="min-h-screen bg-white"><Navbar /><div className="p-20 animate-pulse bg-gray-50 h-screen" /></div>;

  const pendingOrders = orders.filter(o => o.delivery_status !== 'delivered');
  const deliveredOrders = orders.filter(o => o.delivery_status === 'delivered');

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div className="md:col-span-2 bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                 <div>
                   <h1 className="text-3xl font-black uppercase italic tracking-tighter">AGENT {agent.full_name.split(' ')[0]}</h1>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Fleet ID: {agent.id.slice(0, 8)}</p>
                 </div>
                 <button 
                  onClick={toggleActive}
                  disabled={isUpdating}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                    agent.is_active 
                      ? 'bg-[var(--color-primary-green)] text-white shadow-[0_10px_20px_rgba(34,197,94,0.3)]' 
                      : 'bg-white/10 text-white'
                  }`}
                 >
                   <div className={`h-2 w-2 rounded-full ${agent.is_active ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                   {agent.is_active ? 'Online & Ready' : 'System Offline'}
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Total Earnings</span>
                    <div className="text-3xl font-black tracking-tighter">₹{agent.salary.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Deliveries</span>
                    <div className="text-3xl font-black tracking-tighter">{agent.total_orders}</div>
                  </div>
               </div>
             </div>
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <ShieldCheck className="h-40 w-40" />
             </div>
           </div>

           <StatCard icon={Star} label="Rating" value={agent.average_rating || '5.0'} color="amber" />
           <StatCard icon={MapPin} label="Zone" value={agent.area} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Active Orders */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-outfit text-3xl font-black text-slate-950 uppercase tracking-tighter italic">Active Tasks</h2>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">{pendingOrders.length} New</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-[40px] p-16 text-center border-2 border-dashed border-gray-200">
                <Truck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-400 uppercase italic">No pending deliveries</h3>
                <p className="text-xs font-bold text-slate-400 mt-2">Go online to receive automatic assignments</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                      <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-3">
                          <Package className="h-6 w-6 text-[var(--color-primary-green)]" />
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">ORDER #{order.id.slice(0, 8)}</span>
                            <p className="font-bold text-slate-900">{order.order_items.length} Packages to deliver</p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                          <div className="flex gap-4">
                            <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900">{order.shipping_house_no}, {order.shipping_street}</p>
                              <p className="text-xs font-black uppercase text-slate-400 tracking-widest italic">{order.shipping_area}</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                            <a href={`tel:${order.mobile_number}`} className="font-bold text-[var(--color-primary-green)] underline">Contact Customer</a>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-64 flex flex-col gap-3 justify-end">
                        {order.delivery_status === 'assigned' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest italic text-xs shadow-lg hover:bg-[var(--color-primary-green)] transition-all"
                          >
                            Mark Out for Delivery
                          </button>
                        )}
                        {order.delivery_status === 'out_for_delivery' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="w-full h-14 bg-[var(--color-primary-green)] text-white rounded-2xl font-black uppercase tracking-widest italic text-xs shadow-lg hover:bg-green-600 transition-all"
                          >
                            Confirm Delivered
                          </button>
                        )}
                        <span className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Status: {order.delivery_status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History / Earnings */}
          <div className="space-y-8">
             <h2 className="font-outfit text-2xl font-black text-slate-950 uppercase tracking-tighter italic">History</h2>
             <div className="bg-white rounded-[40px] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {deliveredOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-sm font-bold">No completed orders yet</div>
                ) : deliveredOrders.map(order => (
                  <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div>
                       <p className="font-bold text-slate-900">#{order.id.slice(0, 8)}</p>
                       <p className="text-[10px] font-black uppercase text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                     </div>
                     <div className="text-right">
                       <p className="font-black text-slate-900 tracking-tighter italic">₹{order.total_amount}</p>
                       <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">Delivered</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  const colors: any = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100"
  };

  return (
    <div className={`rounded-[40px] p-8 border ${colors[color]} flex flex-col justify-between`}>
      <Icon className="h-8 w-8 mb-4" />
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">{label}</span>
        <div className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</div>
      </div>
    </div>
  );
}
