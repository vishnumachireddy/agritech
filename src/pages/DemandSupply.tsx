import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, AlertCircle, ArrowRight, CheckCircle, MapPin, TrendingUp, Star, Loader2, Package, Users, Calendar, Sprout, Plus, Edit3, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { API_BASE } from "@/config";

interface RegionDemand {
  name: string;
  demand: "HIGH" | "MEDIUM" | "LOW";
  shortage: boolean;
  potential: string;
  farmerCount: number;
}

interface FarmerBuyer {
  name: string;
  region: string;
  crop: string;
  price: number;
  yield: number;
}

interface MarketDemand {
  id: string;
  bulk_order_id: string;
  crop_name: string;
  total_quantity: number;
  fulfilled_quantity?: number;
  total_committed?: number;
  region: string;
  demand_status: string;
  created_at: string;
  bulk_orders?: {
    unit?: string;
    expected_delivery_start?: string;
    expected_delivery_end?: string;
  };
  farmer_commitments?: {
    id: string;
    farmer_id: string;
    committed_quantity: number;
  }[];
}

const getTodayKolkataString = () => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

const DemandSupply = () => {
  const { user } = useAuth();
  const todayDateStr = getTodayKolkataString();
  const [tab, setTab] = useState<"production" | "market_demand" | "regions" | "buyers">("production");
  const [regions, setRegions] = useState<RegionDemand[]>([]);
  const [buyers, setBuyers] = useState<FarmerBuyer[]>([]);
  const [marketDemands, setMarketDemands] = useState<MarketDemand[]>([]);
  const [myCrops, setMyCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Commitment state
  const [selectedDemand, setSelectedDemand] = useState<MarketDemand | null>(null);
  const [commitmentQuantity, setCommitmentQuantity] = useState("");
  const [committing, setCommitting] = useState(false);

  // Publish Production Batch State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newCropName, setNewCropName] = useState("");
  const [newCropVariety, setNewCropVariety] = useState("");
  const [newExpectedQty, setNewExpectedQty] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [newHarvestDate, setNewHarvestDate] = useState(todayDateStr);
  const [newLocation, setNewLocation] = useState("Kurnool, Andhra Pradesh");
  const [newPrice, setNewPrice] = useState("");
  const [newStatus, setNewStatus] = useState("growing");

  // Inline Quantity Update Dialog
  const [editingCrop, setEditingCrop] = useState<any | null>(null);
  const [editQty, setEditQty] = useState("");
  const [updatingCropQty, setUpdatingCropQty] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch crops from backend
      try {
        const cropRes = await fetch(`${API_BASE}/crops`);
        if (cropRes.ok) {
          const cropsData = await cropRes.json();
          if (Array.isArray(cropsData)) {
            setMyCrops(cropsData);
          }
        }
      } catch (e) {
        console.warn("Error fetching crops:", e);
      }

      const { data: farmers } = await supabase.rpc("get_public_farmer_profiles");
      const { data: details } = await supabase.from("farmer_details").select("*");
      const { data: orders } = await supabase.from("orders").select("*");

      const farmerList = Array.isArray(farmers) ? farmers : [];
      const detailList = Array.isArray(details) ? details : [];
      const orderList = Array.isArray(orders) ? orders : [];

      const detailsMap = new Map(detailList.map((d: any) => [d.user_id, d]));

      // Build region demand data
      const regionMap: Record<string, { count: number; totalYield: number; totalOrders: number }> = {};
      farmerList.forEach((f: any) => {
        const r = f.region || "Andhra Pradesh";
        if (!regionMap[r]) regionMap[r] = { count: 0, totalYield: 0, totalOrders: 0 };
        regionMap[r].count += 1;
        const d = detailsMap.get(f.id) as any;
        if (d) regionMap[r].totalYield += d.total_yield || 0;
      });

      orderList.forEach((o: any) => {
        const farmer = farmerList.find((f: any) => f.id === o.farmer_id);
        const r = farmer?.region || "Andhra Pradesh";
        if (!regionMap[r]) regionMap[r] = { count: 1, totalYield: 1000, totalOrders: 0 };
        regionMap[r].totalOrders += 1;
      });

      if (Object.keys(regionMap).length === 0) {
        regionMap["Andhra Pradesh"] = { count: 5, totalYield: 12000, totalOrders: 14 };
        regionMap["Maharashtra"] = { count: 3, totalYield: 8500, totalOrders: 9 };
        regionMap["Punjab"] = { count: 4, totalYield: 15000, totalOrders: 18 };
      }

      const regionList: RegionDemand[] = Object.entries(regionMap).map(([name, data]) => {
        const demandRatio = data.totalOrders / Math.max(data.count, 1);
        return {
          name,
          demand: demandRatio > 2 ? "HIGH" : demandRatio > 0.5 ? "MEDIUM" : "LOW",
          shortage: data.totalYield < 10000,
          potential: `+${Math.round(demandRatio * 10 + 15)}%`,
          farmerCount: data.count,
        };
      });
      setRegions(regionList);

      // Build buyers
      let buyerList: FarmerBuyer[] = farmerList
        .filter((f: any) => detailsMap.has(f.id))
        .map((f: any) => {
          const d = detailsMap.get(f.id) as any;
          return {
            name: f.full_name || "Agri Purchaser",
            region: f.region || "India",
            crop: d.primary_crop || "Organic Produce",
            price: d.expected_price || 60,
            yield: d.total_yield || 5000,
          };
        })
        .sort((a: FarmerBuyer, b: FarmerBuyer) => b.yield - a.yield);

      if (buyerList.length === 0) {
        buyerList = [
          { name: "AP Agro Procurement Co.", region: "Andhra Pradesh", crop: "Sona Masoori Rice", price: 60, yield: 10000 },
          { name: "Maha Harvest Exports", region: "Maharashtra", crop: "Organic Cotton Bales", price: 120, yield: 8000 },
          { name: "North India Grains Corp", region: "Punjab", crop: "Sharbati Wheat", price: 45, yield: 15000 }
        ];
      }
      setBuyers(buyerList);

      // Fetch Market Demands and Farmer Commitments
      const { data: demandsData } = await supabase.from("bulk_orders").select("*");
      const { data: commitmentsData } = await supabase.from("farmer_commitments").select("*");

      const bulkList = Array.isArray(demandsData) ? demandsData : [];
      const commitmentsList = Array.isArray(commitmentsData) ? commitmentsData : [];

      const demandsFormatted: MarketDemand[] = bulkList.map((b: any) => {
        const orderId = b.id || b.bulk_order_id || "bulk-901";
        let relCommitments = commitmentsList.filter(
          (c: any) => c.demand_id === orderId || c.bulk_order_id === orderId || (b.bulk_order_id && c.demand_id === b.bulk_order_id)
        );

        const totalReq = Number(b.quantity_required || b.total_quantity || 1000);
        const baselineFulfilled = Number(b.total_committed ?? b.fulfilled_quantity ?? 0);

        if (relCommitments.length === 0 && baselineFulfilled > 0) {
          relCommitments = [
            {
              id: `baseline-${orderId}`,
              farmer_id: b.farmer_id || "farmer-demo-1",
              committed_quantity: baselineFulfilled,
            }
          ];
        }

        return {
          id: orderId,
          bulk_order_id: orderId,
          crop_name: b.crop_name || "Organic Produce",
          total_quantity: totalReq,
          fulfilled_quantity: baselineFulfilled,
          total_committed: baselineFulfilled,
          region: b.region || "Andhra Pradesh",
          demand_status: b.status || "active",
          created_at: b.created_at || new Date().toISOString(),
          bulk_orders: {
            unit: b.unit || "kg",
            expected_delivery_start: b.expected_delivery_start || "2026-03-01",
            expected_delivery_end: b.expected_delivery_end || "2026-03-15"
          },
          farmer_commitments: relCommitments
        };
      });

      if (demandsFormatted.length === 0) {
        demandsFormatted.push({
          id: "bulk-901",
          bulk_order_id: "bulk-901",
          crop_name: "Organic Sona Masoori Rice",
          total_quantity: 1000,
          fulfilled_quantity: 250,
          total_committed: 250,
          region: "Andhra Pradesh",
          demand_status: "open",
          created_at: new Date().toISOString(),
          bulk_orders: { unit: "kg", expected_delivery_start: "2026-03-01", expected_delivery_end: "2026-03-15" },
          farmer_commitments: [{ id: "commit-init-1", farmer_id: "farmer-demo-1", committed_quantity: 250 }]
        });
      }

      setMarketDemands(demandsFormatted);
    } catch (err) {
      console.error("fetchData error in DemandSupply:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleDbChange = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.table === "bulk_orders" || detail.table === "farmer_commitments" || detail.table === "orders" || detail.table === "crops")) {
        fetchData();
      }
    };

    window.addEventListener("supabase_db_change", handleDbChange);
    return () => {
      window.removeEventListener("supabase_db_change", handleDbChange);
    };
  }, []);

  const getTotalCommitted = (demand: MarketDemand) => {
    const commitments = demand?.farmer_commitments || [];
    const sum = commitments.reduce((acc, c) => acc + (Number(c.committed_quantity) || 0), 0);
    if (sum > 0) return sum;
    return Number(demand.fulfilled_quantity || demand.total_committed || 0);
  };

  const getPercentage = (demand: MarketDemand) => {
    const total = Number(demand.total_quantity || 1);
    const committed = getTotalCommitted(demand);
    return Math.min(100, Math.max(0, Math.round((committed / total) * 100)));
  };

  const handleCommit = async () => {
    if (!user) {
      toast.error("Please sign in as a farmer to commit to production");
      return;
    }
    if (!selectedDemand || !commitmentQuantity) return;

    const quantity = parseFloat(commitmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }

    const currentCommitted = getTotalCommitted(selectedDemand);
    const remainingNeeded = Math.max(0, selectedDemand.total_quantity - currentCommitted);

    if (quantity > remainingNeeded) {
      toast.error(`Cannot commit more than remaining needed (${remainingNeeded} ${selectedDemand.bulk_orders?.unit || "kg"})`);
      return;
    }

    setCommitting(true);

    try {
      const commitmentPayload = {
        id: `commit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        farmer_id: user.id,
        farmer_name: user.full_name || "Verified Farmer",
        demand_id: selectedDemand.id,
        bulk_order_id: selectedDemand.bulk_order_id || selectedDemand.id,
        committed_quantity: quantity,
        status: "committed",
        created_at: new Date().toISOString()
      };

      const { error: commitErr } = await supabase.from("farmer_commitments").insert(commitmentPayload);
      if (commitErr) {
        throw new Error(commitErr.message);
      }

      const newTotalCommitted = currentCommitted + quantity;
      const newRemaining = Math.max(0, selectedDemand.total_quantity - newTotalCommitted);
      const newPct = Math.min(100, Math.round((newTotalCommitted / (selectedDemand.total_quantity || 1)) * 100));

      await supabase.from("bulk_orders").update({
        total_committed: newTotalCommitted,
        fulfilled_quantity: newTotalCommitted,
        remaining_quantity: newRemaining,
        progress_pct: newPct,
        status: newRemaining <= 0 ? "fulfilled" : "open"
      }).eq("id", selectedDemand.bulk_order_id || selectedDemand.id);

      setMarketDemands((prev) =>
        prev.map((d) => {
          if (d.id === selectedDemand.id) {
            const updatedCommitments = [
              ...(d.farmer_commitments || []),
              {
                id: commitmentPayload.id,
                farmer_id: user.id,
                committed_quantity: quantity
              }
            ];
            return {
              ...d,
              fulfilled_quantity: newTotalCommitted,
              total_committed: newTotalCommitted,
              farmer_commitments: updatedCommitments
            };
          }
          return d;
        })
      );

      toast.success(`Successfully committed ${quantity} ${selectedDemand.bulk_orders?.unit || "kg"}!`);
      setSelectedDemand(null);
      setCommitmentQuantity("");
      fetchData();
    } catch (err: any) {
      console.error("Failed to commit:", err);
      toast.error("Failed to commit: " + (err.message || "Unknown error"));
    } finally {
      setCommitting(false);
    }
  };

  const handlePublishProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName || !newExpectedQty || !newPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    const expQty = parseFloat(newExpectedQty);
    const priceVal = parseFloat(newPrice);
    if (isNaN(expQty) || expQty <= 0) {
      toast.error("Please enter a valid production quantity");
      return;
    }
    if (newHarvestDate && newHarvestDate < todayDateStr) {
      toast.error(`Expected harvest date cannot be in the past (${todayDateStr})`);
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        name: newCropName,
        crop_name: newCropName,
        variety: newCropVariety || "Standard",
        expected_quantity: expQty,
        available_quantity: expQty,
        quantity: expQty,
        unit: newUnit,
        expected_harvest_date: newHarvestDate || todayDateStr,
        harvest_date: newHarvestDate || todayDateStr,
        location: newLocation,
        region: newLocation,
        price: priceVal,
        expected_price: priceVal,
        production_status: newStatus,
        status: newStatus,
        farmer_id: user?.id || "farmer-demo-1",
        farmer_name: user?.full_name || "Ramesh Kumar",
        farmer_email: user?.email || "239x1a3253@gprec.ac.in",
        is_bulk_available: true
      };

      const res = await fetch(`${API_BASE}/crops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);

      toast.success(`Production batch for ${newCropName} (${expQty} ${newUnit}) published! Automated notification emails sent to interested buyers.`);
      setShowPublishModal(false);
      setNewCropName("");
      setNewCropVariety("");
      setNewExpectedQty("");
      setNewPrice("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to publish production batch");
    } finally {
      setPublishing(false);
    }
  };

  const handleUpdateCropQuantity = async () => {
    if (!editingCrop || !editQty) return;
    const val = parseFloat(editQty);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative quantity");
      return;
    }

    setUpdatingCropQty(true);
    try {
      const res = await fetch(`${API_BASE}/crops?id=${editingCrop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available_quantity: val,
          quantity: val
        })
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);

      toast.success(`Available quantity for ${editingCrop.name} updated to ${val} ${editingCrop.unit || "kg"}! Milestone emails dispatched.`);
      setEditingCrop(null);
      setEditQty("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update quantity");
    } finally {
      setUpdatingCropQty(false);
    }
  };

  const handleMarkHarvestReady = async (crop: any) => {
    try {
      const res = await fetch(`${API_BASE}/crops?id=${crop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          production_status: "harvest_ready",
          status: "harvest_ready"
        })
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);

      toast.success(`🎉 ${crop.name} marked as HARVEST READY! Automated notification emails sent to buyers and logistics team.`);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <Sprout className="w-6 h-6 text-primary" /> Market Demand & Production Hub
          </h1>
          <p className="text-sm text-muted-foreground">Manage your crop production batches, publish harvest availability, and meet buyer demand</p>
        </div>
        <Button onClick={() => setShowPublishModal(true)} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> Publish Production Availability
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        {[
          { icon: AlertCircle, label: "Demand-Driven", desc: "Produce exactly what the market needs for guaranteed sales.", color: "text-primary" },
          { icon: ArrowRight, label: "Direct Connect", desc: "No middlemen. Connect directly with bulk purchasers.", color: "text-foreground" },
          { icon: CheckCircle, label: "Higher Margins", desc: "Expect 20-30% higher returns through bulk commitments.", color: "text-primary" },
        ].map((i) => (
          <div key={i.label} className="space-y-1">
            <i.icon className={`w-6 h-6 mx-auto mb-2 ${i.color}`} />
            <p className="font-semibold text-sm">{i.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {[
          { key: "production" as const, label: "My Production Availability", icon: Sprout },
          { key: "market_demand" as const, label: "Market Demand", icon: Package },
          { key: "regions" as const, label: "High Demand Regions", icon: TrendingUp },
          { key: "buyers" as const, label: "Bulk Buyers", icon: Star },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tab === "production" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Your published production batches available for consumer bulk ordering</span>
            <span>Automated real-time buyer notifications enabled ⚡</span>
          </div>

          {myCrops.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Sprout className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No production batches published yet</h3>
                <p className="text-muted-foreground text-xs mt-1 mb-4">
                  Publish your upcoming crop yields to notify buyers and receive guaranteed bulk orders.
                </p>
                <Button onClick={() => setShowPublishModal(true)} size="sm">
                  Publish Your First Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCrops.map((crop) => {
                const available = Number(crop.available_quantity ?? crop.quantity ?? 0);
                const expected = Number(crop.expected_quantity ?? crop.quantity ?? available);
                const status = (crop.production_status || crop.status || "growing").toLowerCase();
                const isHarvestReady = status === "harvest_ready" || status === "ready";

                return (
                  <Card key={crop.id} className="overflow-hidden border-border hover:border-primary/40 transition-all card-shadow">
                    <CardHeader className="pb-2 flex-row justify-between items-start space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {crop.name || crop.crop_name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Variety: <span className="font-medium text-foreground">{crop.variety || "Standard"}</span>
                        </p>
                      </div>
                      <Badge className={isHarvestReady ? "bg-emerald-600 text-white border-none text-[10px]" : "bg-amber-500 text-white border-none text-[10px]"}>
                        {isHarvestReady ? "Harvest Ready 🎉" : "Growing in Field 🌱"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1">
                      <div className="p-2.5 bg-muted/40 rounded-lg space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected Harvest:</span>
                          <span className="font-semibold text-foreground">{crop.expected_harvest_date || crop.harvest_date || "Upcoming"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Farm Location:</span>
                          <span className="font-medium text-foreground">{crop.location || crop.region || "Andhra Pradesh"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Rate:</span>
                          <span className="font-bold text-primary">₹{crop.price || crop.expected_price || 50} / {crop.unit || "kg"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 bg-muted/30 rounded border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Expected</p>
                          <p className="font-bold text-sm text-foreground">{expected.toLocaleString()} {crop.unit || "kg"}</p>
                        </div>
                        <div className="p-2 bg-primary/5 rounded border border-primary/10">
                          <p className="text-[10px] text-primary uppercase font-semibold">Available Now</p>
                          <p className="font-bold text-sm text-primary">{available.toLocaleString()} {crop.unit || "kg"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 gap-1"
                          onClick={() => {
                            setEditingCrop(crop);
                            setEditQty(String(available));
                          }}
                        >
                          <Edit3 className="w-3 h-3" /> Update Qty
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isHarvestReady}
                          onClick={() => handleMarkHarvestReady(crop)}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isHarvestReady ? "Harvested" : "Harvest Ready"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === "market_demand" ? (
        marketDemands.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No active bulk demands at the moment. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketDemands.map((demand) => (
              <Card key={demand.id} className="overflow-hidden border-border hover:border-primary/30 transition-all card-shadow">
                <CardHeader className="pb-3 flex-row justify-between items-start space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{demand.crop_name}</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {demand.region}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5 uppercase tracking-wider">
                    Bulk Order
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground mb-1">Total Required</p>
                      <p className="font-bold text-sm text-foreground">{demand.total_quantity} {demand.bulk_orders?.unit || "kg"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/5">
                      <p className="text-primary mb-1">Commitments</p>
                      <p className="font-bold text-sm text-primary">{getTotalCommitted(demand)} {demand.bulk_orders?.unit || "kg"}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span>{getPercentage(demand)}% Fulfilled</span>
                      <span className="text-muted-foreground">Needed: {Math.max(0, demand.total_quantity - getTotalCommitted(demand))} {demand.bulk_orders?.unit || "kg"}</span>
                    </div>
                    <Progress value={getPercentage(demand)} className="h-1.5" />
                  </div>

                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{demand.farmer_commitments?.length || 0} Farmers Joined</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Delivery: {demand.bulk_orders?.expected_delivery_start ? new Date(demand.bulk_orders.expected_delivery_start).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-9 text-xs"
                    onClick={() => setSelectedDemand(demand)}
                    disabled={getPercentage(demand) >= 100}
                  >
                    {getPercentage(demand) >= 100 ? "Fulfilled" : "I Will Produce"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : tab === "regions" ? (
        regions.length === 0 ? (
          <p className="text-muted-foreground">No regional data available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((r) => (
              <div key={r.name} className={`bg-card rounded-xl p-5 card-shadow border ${r.shortage ? "border-agri-red/30 bg-agri-red/5" : "border-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-agri-red" />
                    <span className="font-bold text-foreground">{r.name}</span>
                  </div>
                  <Badge variant={r.demand === "HIGH" ? "destructive" : "secondary"} className="text-xs">
                    {r.demand} DEMAND
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Registered Farmers</span>
                  <span className="font-semibold text-foreground">{r.farmerCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Growth Potential</span>
                  <span className="font-semibold text-emerald-600">{r.potential}</span>
                </div>
                {r.shortage && (
                  <p className="text-xs text-agri-red font-semibold bg-agri-red/10 p-2 rounded-lg">
                    ⚠️ Regional supply deficit detected. Immediate demand for local produce.
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        buyers.length === 0 ? (
          <p className="text-muted-foreground">No buyers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buyers.map((b) => (
              <div key={b.name} className="bg-card rounded-xl p-5 card-shadow border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">{b.name}</span>
                  <Badge variant="outline" className="text-xs text-primary border-primary/20">Active Buyer</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" /> {b.region}
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Desired Crop</span>
                  <span className="font-semibold">{b.crop}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Target Price</span>
                  <span className="font-semibold text-foreground">₹{b.price}/kg</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-muted-foreground">Total Production</span>
                  <span className="font-semibold">{b.yield} kg</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Publish Production Batch Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-primary" /> Publish Crop Production Availability
            </DialogTitle>
            <DialogDescription>
              List your upcoming crop yield to connect directly with commercial bulk buyers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePublishProduction} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crop_name_input">Crop Name *</Label>
                <Input
                  id="crop_name_input"
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  placeholder="e.g. Tomato, Cotton, Rice"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop_variety_input">Variety</Label>
                <Input
                  id="crop_variety_input"
                  value={newCropVariety}
                  onChange={(e) => setNewCropVariety(e.target.value)}
                  placeholder="e.g. Roma, Hybrid, Sona Masoori"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp_qty_input">Expected Quantity *</Label>
                <Input
                  id="exp_qty_input"
                  type="number"
                  min="1"
                  value={newExpectedQty}
                  onChange={(e) => setNewExpectedQty(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_input">Unit</Label>
                <Select value={newUnit} onValueChange={setNewUnit}>
                  <SelectTrigger id="unit_input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg (Kilograms)</SelectItem>
                    <SelectItem value="quintal">Quintals</SelectItem>
                    <SelectItem value="tonnes">Tonnes</SelectItem>
                    <SelectItem value="bales">Bales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="harvest_date_input">Expected Harvest Date *</Label>
                <Input
                  id="harvest_date_input"
                  type="date"
                  min={todayDateStr}
                  value={newHarvestDate}
                  onChange={(e) => setNewHarvestDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_input">Expected Price (₹ / unit) *</Label>
                <Input
                  id="price_input"
                  type="number"
                  min="1"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="e.g. 35"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loc_input">Farm Location *</Label>
                <Input
                  id="loc_input"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Kurnool, Andhra Pradesh"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_input">Initial Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status_input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growing">Growing in Field</SelectItem>
                    <SelectItem value="harvest_ready">Harvest Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPublishModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={publishing} className="gap-1.5">
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Publish Batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Quantity Update Modal */}
      <Dialog open={!!editingCrop} onOpenChange={(open) => !open && setEditingCrop(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" /> Update Available Quantity
            </DialogTitle>
            <DialogDescription>
              Adjust available quantity for {editingCrop?.name}. Interested buyers will receive an automated milestone update email.
            </DialogDescription>
          </DialogHeader>
          {editingCrop && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <p><strong>Crop:</strong> {editingCrop.name}</p>
                <p><strong>Total Expected:</strong> {editingCrop.expected_quantity || editingCrop.quantity} {editingCrop.unit || "kg"}</p>
                <p><strong>Currently Available:</strong> {editingCrop.available_quantity ?? editingCrop.quantity} {editingCrop.unit || "kg"}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_qty_input">New Available Quantity ({editingCrop.unit || "kg"}) *</Label>
                <Input
                  id="edit_qty_input"
                  type="number"
                  min="0"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  placeholder="e.g. 3000"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingCrop(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdateCropQuantity} disabled={updatingCropQty} className="gap-1.5">
                  {updatingCropQty ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save & Notify Buyers
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commitment Modal */}
      <Dialog open={!!selectedDemand} onOpenChange={(open) => !open && setSelectedDemand(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Commit to Production</DialogTitle>
            <DialogDescription>
              Specify the quantity you can supply for this regional demand order.
            </DialogDescription>
          </DialogHeader>
          {selectedDemand && (
            <div className="space-y-6 py-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Order Details</p>
                <div className="flex justify-between items-baseline">
                  <h4 className="text-xl font-bold">{selectedDemand.crop_name}</h4>
                  <p className="text-sm font-medium">{selectedDemand.total_quantity} {selectedDemand.bulk_orders?.unit || "kg"}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{selectedDemand.region}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity you will produce ({selectedDemand.bulk_orders?.unit || "kg"})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    autoFocus
                    placeholder={`e.g. 500`}
                    value={commitmentQuantity}
                    onChange={(e) => setCommitmentQuantity(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground italic">Remaining needed: {Math.max(0, selectedDemand.total_quantity - getTotalCommitted(selectedDemand))} {selectedDemand.bulk_orders?.unit || "kg"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDemand(null)}>Cancel</Button>
            <Button onClick={handleCommit} disabled={committing || !commitmentQuantity}>
              {committing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirm Commitment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandSupply;
