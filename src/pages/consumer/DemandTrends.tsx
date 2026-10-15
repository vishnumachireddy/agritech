import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2, Flame, TrendingUp, TrendingDown } from "lucide-react";

interface OrderData {
  crop_name: string;
  quantity: number;
  price_per_kg: number;
  total_price: number;
  status: string;
  created_at: string;
  farmer_id: string;
}

const DemandTrends = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [regions, setRegions] = useState<{ region: string; farmer_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState("all");

  const fetchData = async () => {
    if (orders.length === 0) setLoading(true);
    try {
      const [ordersRes, detailsRes] = await Promise.all([
        supabase.from("orders").select("crop_name, quantity, price_per_kg, total_price, status, created_at, farmer_id"),
        supabase.rpc("get_public_farmer_profiles"),
      ]);

      let fetchedOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      let fetchedProfiles = Array.isArray(detailsRes.data) ? detailsRes.data : [];

      if (fetchedOrders.length === 0) {
        fetchedOrders = [
          { crop_name: "Organic Sona Masoori Rice", quantity: 500, price_per_kg: 55, total_price: 27500, status: "delivered", created_at: "2026-02-20T10:00:00Z", farmer_id: "farmer-demo-1" },
          { crop_name: "Organic Sona Masoori Rice", quantity: 300, price_per_kg: 58, total_price: 17400, status: "accepted", created_at: "2026-02-22T10:00:00Z", farmer_id: "farmer-demo-1" },
          { crop_name: "Raw Organic Cotton Bales", quantity: 200, price_per_kg: 120, total_price: 24000, status: "pending", created_at: "2026-02-23T10:00:00Z", farmer_id: "farmer-demo-1" },
          { crop_name: "Fresh Harvest Sharbati Wheat", quantity: 1000, price_per_kg: 42, total_price: 42000, status: "delivered", created_at: "2026-02-24T10:00:00Z", farmer_id: "farmer-demo-2" },
          { crop_name: "Fresh Harvest Sharbati Wheat", quantity: 1500, price_per_kg: 45, total_price: 67500, status: "accepted", created_at: "2026-02-25T10:00:00Z", farmer_id: "farmer-demo-2" }
        ];
      }

      if (fetchedProfiles.length === 0) {
        fetchedProfiles = [
          { id: "farmer-demo-1", region: "Andhra Pradesh" },
          { id: "farmer-demo-2", region: "Maharashtra" }
        ];
      }

      setOrders(fetchedOrders);
      setRegions(fetchedProfiles.map((p: any) => ({ region: p.region || "Andhra Pradesh", farmer_id: p.id })));
    } catch (err) {
      console.error("fetchData error in DemandTrends:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("demand_trends_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "rejected"), [orders]);
  const cropNames = useMemo(() => [...new Set(activeOrders.map((o) => o.crop_name))].sort(), [activeOrders]);

  // Price trends: avg price per day for selected crop
  const priceTrends = useMemo(() => {
    const filtered = selectedCrop === "all" ? activeOrders : activeOrders.filter((o) => o.crop_name === selectedCrop);
    const byDay: Record<string, { total: number; count: number }> = {};
    filtered.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString();
      if (!byDay[day]) byDay[day] = { total: 0, count: 0 };
      byDay[day].total += o.price_per_kg;
      byDay[day].count += 1;
    });
    return Object.entries(byDay)
      .map(([date, v]) => ({ date, avg_price: Math.round(v.total / v.count) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeOrders, selectedCrop]);

  // High demand crops
  const demandCrops = useMemo(() => {
    const counts: Record<string, number> = {};
    activeOrders.forEach((o) => { counts[o.crop_name] = (counts[o.crop_name] || 0) + 1; });
    return Object.entries(counts)
      .map(([crop, count]) => ({
        crop,
        count,
        level: count >= 5 ? "very_high" : count >= 2 ? "rising" : "stable",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activeOrders]);

  // Region heatmap
  const regionData = useMemo(() => {
    const farmerRegion = new Map(regions.map((r) => [r.farmer_id, r.region]));
    const byRegion: Record<string, { orders: number; quantity: number }> = {};
    activeOrders.forEach((o) => {
      const region = farmerRegion.get(o.farmer_id) || "Andhra Pradesh";
      if (!byRegion[region]) byRegion[region] = { orders: 0, quantity: 0 };
      byRegion[region].orders += 1;
      byRegion[region].quantity += o.quantity;
    });
    return Object.entries(byRegion)
      .map(([region, v]) => ({ region, ...v }))
      .sort((a, b) => b.orders - a.orders);
  }, [activeOrders, regions]);

  const getDemandBadge = (level: string) => {
    if (level === "very_high") return <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30 gap-0.5"><Flame className="w-3 h-3" /> Very High</Badge>;
    if (level === "rising") return <Badge className="bg-primary/15 text-primary border-primary/30 gap-0.5"><TrendingUp className="w-3 h-3" /> Rising</Badge>;
    return <Badge variant="outline" className="gap-0.5"><TrendingDown className="w-3 h-3" /> Stable</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading market intelligence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-foreground">Demand & Trends</h1>

      {/* Price Trends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Price Trends</CardTitle>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              {cropNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {priceTrends.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No price data available yet. Trends appear as orders are placed.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={priceTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="avg_price" name="Avg ₹/kg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* High Demand Crops */}
        <Card>
          <CardHeader><CardTitle className="text-base">High Demand Crops</CardTitle></CardHeader>
          <CardContent>
            {demandCrops.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No market demand data yet.</p>
            ) : (
              <div className="space-y-3">
                {demandCrops.map((item) => (
                  <div key={item.crop} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.crop}</p>
                      <p className="text-xs text-muted-foreground">{item.count} orders</p>
                    </div>
                    {getDemandBadge(item.level)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Heatmap */}
        <Card>
          <CardHeader><CardTitle className="text-base">Demand by Region</CardTitle></CardHeader>
          <CardContent>
            {regionData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No regional data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="region" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="orders" name="Orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemandTrends;
