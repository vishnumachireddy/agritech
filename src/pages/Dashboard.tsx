import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sprout, TrendingUp, Droplets, AlertTriangle, Shield, ArrowRight, Heart, ChevronDown, IndianRupee, Package } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "@/config";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalCrops: 0, activeOrders: 0, revenue: 0, waterSaved: "0L", alerts: 0 });
  const [farmerRegion, setFarmerRegion] = useState("Your Region");
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([
    { name: "PM KISAN", desc: "₹6,000/yr income support for landholding farmers." },
    { name: "PM Fasal Bima", desc: "Crop insurance against non-preventable natural risks." },
    { name: "Rythu Bharosa", desc: "Financial assistance & input subsidy for farmers." },
    { name: "Soil Health Card", desc: "Test soil health and get nutrient recommendations." },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (user.region) setFarmerRegion(user.region);
        else if (user.user_metadata?.region) setFarmerRegion(user.user_metadata.region);

        let cropCount = user.primary_crop ? 1 : 1;
        if (user.secondary_crop && user.secondary_crop !== "none") cropCount += 1;

        let activeOrdersCount = 0;
        let pendingCount = 0;
        let totalRev = 0;

        try {
          const res = await fetch(`${API_BASE}/orders?farmer_id=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              activeOrdersCount = data.filter((o: any) => o.status !== "delivered" && o.status !== "rejected").length;
              pendingCount = data.filter((o: any) => o.status === "pending").length;
              totalRev = data.filter((o: any) => o.status === "delivered").reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);
            }
          }
        } catch (err) {
          console.error("FastAPI orders fetch error:", err);
        }

        const waterMap: Record<string, string> = { High: "3,200L", Medium: "2,450L", Low: "1,100L" };
        const waterLabel = waterMap[user.water_availability || "Medium"] || "2,450L";

        setStats({
          totalCrops: cropCount,
          activeOrders: activeOrdersCount,
          revenue: totalRev,
          waterSaved: waterLabel,
          alerts: pendingCount,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Realtime subscription for orders
    const channel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `farmer_id=eq.${user?.id}` }, () => {
        console.log("Orders changed, refetching dashboard stats");
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statCards = [
    { label: "Total Crops", value: loading ? "..." : String(stats.totalCrops), sub: "Your registered crops", icon: Sprout, color: "text-primary" },
    { label: "Active Orders", value: loading ? "..." : String(stats.activeOrders), sub: stats.activeOrders > 0 ? `${stats.alerts} pending` : "No active orders", icon: Package, color: "text-agri-blue" },
    { label: "Revenue", value: loading ? "..." : `₹${stats.revenue.toLocaleString()}`, sub: "From delivered orders", icon: IndianRupee, color: "text-agri-teal" },
    { label: "Water Saved", value: loading ? "..." : stats.waterSaved, sub: "Based on availability", icon: Droplets, color: "text-agri-amber" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="agri-gradient rounded-2xl p-8 text-primary-foreground">
        <span className="inline-block px-3 py-1 bg-primary-foreground/20 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
          Community Intelligence Hub
        </span>
        <h1 className="text-3xl font-display font-bold mb-2">Welcome{user?.full_name ? `, ${user.full_name}` : ""} to AgriAssist</h1>
        <p className="text-primary-foreground/80 max-w-lg">
          Your smart farming companion. Monitor crop health, get AI-powered insights,
          and optimize your farm's productivity.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-primary-foreground/70">District Regional Insights</span>
          <span className="font-display font-bold text-lg">{farmerRegion}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-5 card-shadow border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Government Schemes */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h2 className="font-display font-bold text-lg uppercase tracking-wide">Government Schemes</h2>
            <p className="text-xs text-muted-foreground">Subsidies & Financial Aid</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schemes.map((s) => (
            <div key={s.name} className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
              <p className="font-semibold text-sm text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
        <button className="mt-4 flex items-center gap-2 text-primary text-sm font-medium hover:underline">
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Decision Score */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 card-shadow border border-border">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-display font-bold uppercase tracking-wide">Farmer Decision Score™</h3>
              <p className="text-sm text-muted-foreground">Status: <span className="text-primary font-semibold">{stats.alerts === 0 ? "EXCELLENT" : "NEEDS ATTENTION"}</span></p>
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-accent text-primary text-xs font-medium rounded-full">
                📈 Based on real-time data
              </span>
            </div>
            <div className="ml-auto flex flex-col items-center">
              <div className="w-20 h-20 rounded-xl border-2 border-primary flex flex-col items-center justify-center">
                <Heart className="w-4 h-4 text-primary mb-1" />
                <span className="text-2xl font-display font-bold text-primary">
                  {stats.alerts === 0 ? "100%" : `${Math.max(0, 100 - stats.alerts * 10)}%`}
                </span>
              </div>
            </div>
            <button className="ml-4 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
              WHY? <ChevronDown className="w-3 h-3 inline ml-1" />
            </button>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-card rounded-xl p-6 card-shadow border border-border">
          <p className="text-xs font-semibold text-agri-orange uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-display font-bold text-primary mt-2">₹{stats.revenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">From {stats.activeOrders} active + delivered orders.</p>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Efficiency Rating</span>
            <span className="px-2 py-0.5 bg-accent text-primary font-semibold rounded-full">
              {stats.alerts === 0 ? "EXCELLENT" : "GOOD"}
            </span>
          </div>
        </div>
      </div>

      {/* Decision Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-6 card-shadow border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold uppercase tracking-wide">Decision Trace Engine™</h3>
            <span className="px-2 py-1 bg-accent text-primary text-xs font-medium rounded-full">Season Analysis</span>
          </div>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Regret Score™</p>
              <p className="font-display font-bold text-xl">{stats.alerts > 0 ? stats.alerts * 5 : 15} <span className="text-sm text-muted-foreground font-normal">/ 100</span></p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Tone</p>
              <p className="text-sm font-medium text-foreground">"Learning together"</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Crops", value: `${stats.totalCrops} registered`, color: "bg-primary" },
              { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, color: "bg-agri-blue" },
              { label: "Orders", value: `${stats.activeOrders} active`, color: stats.alerts > 0 ? "bg-agri-red" : "bg-primary" },
              { label: "Region", value: farmerRegion, color: "bg-primary" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className={`w-6 h-6 rounded-full ${item.color} mx-auto mb-1`} />
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{item.label}</p>
                <p className="text-xs font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-accent/50 rounded-lg">
            <p className="text-xs font-semibold text-agri-orange">Insights</p>
            <p className="text-xs text-muted-foreground">Your decisions are based on real-time data from your farm profile and orders.</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 card-shadow border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wider">Crop Failure Early-Warning</p>
              <p className="font-display font-bold text-lg">{stats.alerts > 2 ? "Medium Risk" : "Low Risk"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.alerts > 2
              ? "You have multiple pending orders. Review them promptly."
              : "Stable conditions. Keep monitoring your orders."}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence: {stats.alerts === 0 ? "85%" : "70%"}</span>
            <span className="text-primary font-semibold">Live Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
