import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Calendar, Package, CheckCircle2, Truck, Box, Clock, Edit3, ArrowUpRight, Sprout, ShoppingCart, UserCheck, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { API_BASE } from "@/config";

interface BulkOrder {
  id: string;
  crop_name: string;
  quantity_required: number;
  fulfilled_quantity: number;
  total_committed?: number;
  remaining_quantity: number;
  progress_percentage: number;
  unit: string;
  region: string | null;
  expected_delivery_start: string | null;
  expected_delivery_end: string | null;
  status: string;
  created_at: string;
  farmer_name?: string;
  customer_id?: string;
  consumer_id?: string;
}

interface FarmerProductionListing {
  id: string;
  farmer_id: string;
  farmer_name: string;
  name: string;
  crop_name?: string;
  variety?: string;
  expected_quantity?: number;
  available_quantity?: number;
  quantity?: number;
  unit?: string;
  expected_harvest_date?: string;
  expected_availability_date?: string;
  harvest_date?: string;
  production_status?: string;
  status?: string;
  location?: string;
  region?: string;
  price?: number;
  expected_price?: number;
  created_at?: string;
}

const BulkOrders = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"listings" | "contracts">("listings");
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [farmerListings, setFarmerListings] = useState<FarmerProductionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Direct Farmer Ordering Modal
  const [selectedFarmerListing, setSelectedFarmerListing] = useState<FarmerProductionListing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [orderDeliveryStart, setOrderDeliveryStart] = useState("");
  const [orderDeliveryEnd, setOrderDeliveryEnd] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Fulfillment update dialog
  const [editingOrder, setEditingOrder] = useState<BulkOrder | null>(null);
  const [newFulfilledQty, setNewFulfilledQty] = useState<string>("");
  const [updatingFulfillment, setUpdatingFulfillment] = useState(false);

  // Form fields for custom demand
  const [cropName, setCropName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [region, setRegion] = useState("");
  const [deliveryStart, setDeliveryStart] = useState("");
  const [deliveryEnd, setDeliveryEnd] = useState("");

  /**
   * Exact progress calculation:
   * Progress (%) = (Fulfilled quantity / Total ordered quantity) * 100
   */
  const calculateMetrics = (fulfilled: number, total: number) => {
    const validTotal = Math.max(0, Number(total) || 0);
    const validFulfilled = Math.max(0, Math.min(validTotal, Number(fulfilled) || 0));
    const remaining = Math.max(0, validTotal - validFulfilled);
    const percentage = validTotal > 0 ? Math.min(100, Math.max(0, Math.round((validFulfilled / validTotal) * 100))) : 0;
    return {
      total: validTotal,
      fulfilled: validFulfilled,
      remaining,
      percentage,
    };
  };

  const fetchFarmerListings = async () => {
    try {
      const res = await fetch(`${API_BASE}/crops`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFarmerListings(data);
        }
      }
    } catch (e) {
      console.warn("fetchFarmerListings warning:", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("agri_token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // 1. Fetch bulk orders
      let bulkData: any[] = [];
      try {
        const res = await fetch(`${API_BASE}/bulk_orders`, { headers });
        if (res.ok) {
          bulkData = await res.json();
        }
      } catch (e) {}

      // 2. Fetch consumer orders from unified orders table
      let orderData: any[] = [];
      try {
        const orderRes = await fetch(`${API_BASE}/orders`, { headers });
        if (orderRes.ok) {
          orderData = await orderRes.json();
        }
      } catch (e) {}

      const bulkList = Array.isArray(bulkData) ? bulkData : [];
      const orderList = Array.isArray(orderData) ? orderData.filter((o: any) => o.is_bulk || o.order_type === "bulk") : [];

      const combinedMap = new Map<string, any>();

      bulkList.forEach((b: any) => {
        combinedMap.set(b.id, b);
      });

      orderList.forEach((o: any) => {
        const existing = combinedMap.get(o.id) || combinedMap.get(o.bulk_order_id);
        if (existing) {
          combinedMap.set(existing.id, {
            ...existing,
            ...o,
            status: o.status || existing.status,
            fulfilled_quantity: o.fulfilled_quantity ?? existing.fulfilled_quantity ?? 0,
            quantity_required: o.quantity_required ?? o.quantity ?? existing.quantity_required ?? 100
          });
        } else {
          combinedMap.set(o.id, {
            id: o.id,
            customer_id: o.consumer_id || o.customer_id,
            consumer_id: o.consumer_id || o.customer_id,
            crop_name: o.crop_name,
            quantity_required: o.quantity_required || o.quantity || 100,
            fulfilled_quantity: o.fulfilled_quantity || 0,
            total_committed: o.fulfilled_quantity || 0,
            unit: o.unit || "kg",
            region: o.region || "Andhra Pradesh",
            status: o.status || "open",
            farmer_name: o.farmer_name,
            created_at: o.created_at || new Date().toISOString()
          });
        }
      });

      let rawOrders = Array.from(combinedMap.values());

      if (rawOrders.length === 0) {
        rawOrders = [
          {
            id: "bulk-901",
            customer_id: user?.id || "consumer-demo-1",
            consumer_id: user?.id || "consumer-demo-1",
            crop_name: "Organic Sona Masoori Rice",
            quantity_required: 1000,
            fulfilled_quantity: 250,
            total_committed: 250,
            unit: "kg",
            region: "Andhra Pradesh",
            expected_delivery_start: "2026-03-01",
            expected_delivery_end: "2026-03-15",
            status: "open",
            farmer_name: "Ramesh Kumar",
            created_at: new Date().toISOString(),
          }
        ];
      }

      const processedOrders: BulkOrder[] = rawOrders.map((order: any) => {
        const total = Number(order.quantity_required ?? order.quantity ?? 100);
        const fulfilled = Number(order.fulfilled_quantity ?? order.total_committed ?? 0);
        const metrics = calculateMetrics(fulfilled, total);

        return {
          id: order.id || "bulk-1",
          crop_name: order.crop_name || "Organic Crop",
          quantity_required: metrics.total,
          fulfilled_quantity: metrics.fulfilled,
          total_committed: metrics.fulfilled,
          remaining_quantity: metrics.remaining,
          progress_percentage: metrics.percentage,
          unit: order.unit || "kg",
          region: order.region || "Andhra Pradesh",
          expected_delivery_start: order.expected_delivery_start || "2026-03-01",
          expected_delivery_end: order.expected_delivery_end || "2026-03-15",
          status: order.status || (metrics.percentage >= 100 ? "fulfilled" : "open"),
          created_at: order.created_at || new Date().toISOString(),
          farmer_name: order.farmer_name,
          customer_id: order.customer_id || order.consumer_id,
          consumer_id: order.consumer_id || order.customer_id,
        };
      });

      processedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(processedOrders);
    } catch (err) {
      console.error("fetchOrders error in BulkOrders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchFarmerListings();

    const handleDbChange = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.table === "bulk_orders" || detail.table === "orders" || detail.table === "crops")) {
        fetchOrders();
        fetchFarmerListings();
      }
    };
    window.addEventListener("supabase_db_change", handleDbChange);

    const channel = supabase
      .channel("bulk_orders_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "bulk_orders" }, () => {
        fetchOrders();
        fetchFarmerListings();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crops" }, () => {
        fetchFarmerListings();
      })
      .subscribe();

    return () => {
      window.removeEventListener("supabase_db_change", handleDbChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName || !quantity || !region) {
      toast.error("Please fill in all required fields");
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("agri_token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const payload = {
        crop_name: cropName,
        quantity_required: qtyNum,
        fulfilled_quantity: 0,
        total_committed: 0,
        remaining_quantity: qtyNum,
        progress_pct: 0.0,
        unit,
        region,
        expected_delivery_start: deliveryStart || null,
        expected_delivery_end: deliveryEnd || null,
        status: "open",
        customer_id: user?.id || "consumer-demo-1",
        consumer_id: user?.id || "consumer-demo-1",
        farmer_name: "Open Contract (Pending Fulfillment)"
      };

      const res = await fetch(`${API_BASE}/bulk_orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to create order. Status: ${res.status}`);
      }

      toast.success(
        language === "te"
          ? "బల్క్ ఆర్డర్ విజయవంతంగా సృష్టించబడింది (0% పూర్తయింది)"
          : "Bulk order created successfully (0% fulfilled)"
      );

      setShowForm(false);
      setCropName("");
      setQuantity("");
      setRegion("");
      setDeliveryStart("");
      setDeliveryEnd("");
      await fetchOrders();
      setActiveTab("contracts");
    } catch (err: any) {
      console.error("Create bulk order error:", err);
      toast.error(err.message || "Failed to create bulk order");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrderWithFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerListing) return;

    const qty = parseFloat(orderQuantity);
    const available = Number(selectedFarmerListing.available_quantity ?? selectedFarmerListing.quantity ?? 1000);

    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }
    if (qty > available) {
      toast.error(`Requested quantity exceeds available stock (${available} ${selectedFarmerListing.unit || "kg"})`);
      return;
    }

    setOrderSubmitting(true);
    try {
      const token = localStorage.getItem("agri_token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const cropTitle = selectedFarmerListing.name || selectedFarmerListing.crop_name || "Produce";
      const farmerName = selectedFarmerListing.farmer_name || "Verified Farmer";
      const unitStr = selectedFarmerListing.unit || "kg";
      const pricePerUnit = selectedFarmerListing.price || selectedFarmerListing.expected_price || 50;

      const payload = {
        crop_name: cropTitle,
        crop_id: selectedFarmerListing.id,
        farmer_id: selectedFarmerListing.farmer_id || "farmer-demo-1",
        farmer_name: farmerName,
        customer_id: user?.id || "consumer-demo-1",
        consumer_id: user?.id || "consumer-demo-1",
        customer_email: user?.email || "239x1a3253@gprec.ac.in",
        quantity_required: qty,
        fulfilled_quantity: 0,
        total_committed: 0,
        remaining_quantity: qty,
        progress_pct: 0.0,
        price_per_kg: pricePerUnit,
        total_price: qty * pricePerUnit,
        unit: unitStr,
        region: selectedFarmerListing.location || selectedFarmerListing.region || "Andhra Pradesh",
        expected_delivery_start: orderDeliveryStart || null,
        expected_delivery_end: orderDeliveryEnd || null,
        status: "open",
        is_bulk: true,
        order_type: "bulk"
      };

      const res = await fetch(`${API_BASE}/bulk_orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to place bulk order. Status: ${res.status}`);
      }

      toast.success(`Bulk contract placed with ${farmerName} for ${qty} ${unitStr} of ${cropTitle}! Automated confirmation emails dispatched.`);
      setSelectedFarmerListing(null);
      setOrderQuantity("");
      setOrderDeliveryStart("");
      setOrderDeliveryEnd("");
      await fetchOrders();
      await fetchFarmerListings();
      setActiveTab("contracts");
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error(err.message || "Failed to place order with farmer");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleUpdateFulfillment = async () => {
    if (!editingOrder) return;
    const fulfilledVal = parseFloat(newFulfilledQty);

    if (isNaN(fulfilledVal) || fulfilledVal < 0) {
      toast.error("Please enter a valid non-negative fulfilled quantity");
      return;
    }

    if (fulfilledVal > editingOrder.quantity_required) {
      toast.error(`Fulfilled quantity cannot exceed the total ordered quantity (${editingOrder.quantity_required} ${editingOrder.unit})`);
      return;
    }

    setUpdatingFulfillment(true);
    try {
      const token = localStorage.getItem("agri_token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const metrics = calculateMetrics(fulfilledVal, editingOrder.quantity_required);
      const newStatus = metrics.percentage >= 100 ? "fulfilled" : metrics.percentage > 0 ? "in_progress" : "open";

      const res = await fetch(`${API_BASE}/bulk_orders?id=${editingOrder.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          fulfilled_quantity: metrics.fulfilled,
          total_committed: metrics.fulfilled,
          remaining_quantity: metrics.remaining,
          progress_pct: metrics.percentage,
          status: newStatus
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      toast.success(
        language === "te"
          ? `పురోగతి అప్‌డేట్ చేయబడింది: ${metrics.percentage}% (${metrics.fulfilled}/${metrics.total} ${editingOrder.unit})`
          : `Fulfillment updated: ${metrics.percentage}% (${metrics.fulfilled}/${metrics.total} ${editingOrder.unit})`
      );

      setEditingOrder(null);
      setNewFulfilledQty("");
      await fetchOrders();
    } catch (err: any) {
      console.error("Fulfillment update error:", err);
      toast.error(err.message || "Failed to update fulfilled quantity");
    } finally {
      setUpdatingFulfillment(false);
    }
  };

  const getStatusColor = (status: string, progress: number) => {
    if (progress >= 100 || status === "fulfilled" || status === "delivered") {
      return "bg-emerald-600 text-white hover:bg-emerald-700";
    }
    switch (status?.toLowerCase()) {
      case "out_for_delivery":
        return "bg-orange-600 text-white hover:bg-orange-700";
      case "packed":
        return "bg-purple-600 text-white hover:bg-purple-700";
      case "accepted":
      case "in_progress":
        return "bg-blue-600 text-white hover:bg-blue-700";
      case "open":
        return "bg-cyan-600 text-white hover:bg-cyan-700";
      case "pending":
        return "bg-amber-600 text-white hover:bg-amber-700";
      case "rejected":
        return "bg-rose-600 text-white hover:bg-rose-700";
      default:
        return "bg-slate-600 text-white";
    }
  };

  const getStatusLabel = (status: string, progress: number) => {
    if (progress >= 100) {
      return language === "te" ? "పూర్తయింది (100% Fulfilled) ✅" : "Fully Fulfilled (100%) ✅";
    }
    const s = status?.toLowerCase();
    switch (s) {
      case "pending": return "Pending Approval";
      case "open": return "Contract Open";
      case "in_progress": return "Fulfillment in Progress";
      case "accepted": return "Accepted by Producer";
      case "packed": return "Packed & Batch Ready";
      case "out_for_delivery": return "Out for Delivery 🚚";
      case "rejected": return "Rejected";
      default: return status?.replace(/_/g, " ");
    }
  };

  const getProductionStatusBadge = (status?: string) => {
    const s = (status || "growing").toLowerCase();
    if (s === "harvest_ready" || s === "ready") {
      return <Badge className="bg-emerald-600 text-white border-none text-[10px]">Harvest Ready 🎉</Badge>;
    }
    if (s === "completed") {
      return <Badge className="bg-blue-600 text-white border-none text-[10px]">Harvested</Badge>;
    }
    return <Badge className="bg-amber-500 text-white border-none text-[10px]">Growing in Field 🌱</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          {language === "te" ? "బల్క్ ఆర్డర్లు లోడ్ అవుతున్నాయి..." : "Loading bulk contracts..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {language === "te" ? "బల్క్ ఆర్డర్లు & రైతు ఉత్పత్తి మార్కెట్" : "Bulk Orders & Farmer Production"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover verified farmer harvest batches, view real-time availability, and secure direct bulk contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm(true)} size="sm" variant="outline" className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Custom Demand Request
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sprout className="w-4 h-4" /> Farmer Production Listings
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {farmerListings.length}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab("contracts")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "contracts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> My Bulk Contracts
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {orders.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: Farmer Production Listings */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing verified active crop batches from registered agricultural producers</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Farmer-to-Consumer Traceability
            </span>
          </div>

          {farmerListings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Sprout className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No farmer production listings active</h3>
                <p className="text-muted-foreground text-xs mt-1">
                  Registered farmers will display their upcoming harvest production quantities here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmerListings.map((listing) => {
                const available = Number(listing.available_quantity ?? listing.quantity ?? 0);
                const expected = Number(listing.expected_quantity ?? listing.quantity ?? available);
                const harvestDateStr = listing.expected_harvest_date || listing.harvest_date || "Upcoming";
                const cropTitle = listing.name || listing.crop_name || "Produce";
                const farmerName = listing.farmer_name || "Verified Local Producer";
                const unitStr = listing.unit || "kg";
                const priceVal = listing.price || listing.expected_price || 45;

                return (
                  <Card key={listing.id} className="overflow-hidden border-border hover:border-primary/40 transition-all shadow-sm">
                    <CardHeader className="pb-2 flex-row justify-between items-start space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                          {cropTitle}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Variety: <span className="font-medium text-foreground">{listing.variety || "Hybrid / Standard"}</span>
                        </p>
                      </div>
                      {getProductionStatusBadge(listing.production_status || listing.status)}
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1">
                      <div className="p-2.5 bg-muted/40 rounded-lg space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-primary" /> Producing Farmer:
                          </span>
                          <span className="font-semibold text-foreground">{farmerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" /> Location:
                          </span>
                          <span className="font-medium text-foreground">{listing.location || listing.region || "Andhra Pradesh"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" /> Harvest Date:
                          </span>
                          <span className="font-medium text-foreground">{harvestDateStr}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 bg-primary/5 rounded border border-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Available Quantity</p>
                          <p className="font-bold text-sm text-primary">{available.toLocaleString()} {unitStr}</p>
                        </div>
                        <div className="p-2 bg-muted/40 rounded border border-border/60">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Expected Price</p>
                          <p className="font-bold text-sm text-foreground">₹{priceVal} / {unitStr}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full text-xs h-8 gap-1.5 shadow-sm"
                        onClick={() => {
                          setSelectedFarmerListing(listing);
                          setOrderQuantity(String(Math.min(100, available)));
                        }}
                        disabled={available <= 0}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {available <= 0 ? "Allocated / Sold Out" : "Place Bulk Order with Farmer"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Bulk Contracts */}
      {activeTab === "contracts" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No bulk contracts yet</h3>
                <p className="text-muted-foreground text-xs mt-1 mb-4">
                  Order directly from farmer production listings above or submit a custom demand request.
                </p>
                <Button onClick={() => setActiveTab("listings")} variant="outline" size="sm">
                  Browse Farmer Listings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="overflow-hidden border-border/60 hover:border-primary/50 transition-colors shadow-sm"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" /> {order.crop_name}
                        </CardTitle>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <MapPin className="w-3 h-3 text-primary" /> {order.region}
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(order.status, order.progress_percentage)} font-medium shadow-sm transition-all`}>
                        {getStatusLabel(order.status, order.progress_percentage)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Total Ordered</p>
                        <p className="font-bold text-sm text-foreground">
                          {order.quantity_required.toLocaleString()} {order.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Fulfilled</p>
                        <p className="font-bold text-sm text-primary">
                          {order.fulfilled_quantity.toLocaleString()} {order.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Remaining</p>
                        <p className="font-bold text-sm text-amber-600 dark:text-amber-400">
                          {order.remaining_quantity.toLocaleString()} {order.unit}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          {order.progress_percentage === 100 ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : null}
                          {order.progress_percentage}% Fulfilled
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {order.fulfilled_quantity} / {order.quantity_required} {order.unit}
                        </span>
                      </div>
                      <Progress
                        value={order.progress_percentage}
                        className="h-2.5 bg-muted rounded-full overflow-hidden"
                      />
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                        <span>
                          {order.farmer_name ? (
                            <span className="font-medium text-foreground">Farmer: {order.farmer_name}</span>
                          ) : (
                            "Open Community Sourcing"
                          )}
                        </span>
                        <span className="italic">
                          {order.expected_delivery_end
                            ? `Target: ${new Date(order.expected_delivery_end).toLocaleDateString()}`
                            : "Flexible schedule"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                      <span className="font-mono text-[11px]">#{order.id.slice(0, 8)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingOrder(order);
                          setNewFulfilledQty(String(order.fulfilled_quantity));
                        }}
                        className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit3 className="w-3 h-3" /> Update Fulfillment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct Order from Farmer Modal */}
      <Dialog open={!!selectedFarmerListing} onOpenChange={(open) => !open && setSelectedFarmerListing(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Place Bulk Contract Order
            </DialogTitle>
            <DialogDescription>
              Direct contract order with verified producer {selectedFarmerListing?.farmer_name}
            </DialogDescription>
          </DialogHeader>
          {selectedFarmerListing && (
            <form onSubmit={handlePlaceOrderWithFarmer} className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crop & Variety:</span>
                  <span className="font-bold text-foreground">
                    {selectedFarmerListing.name || selectedFarmerListing.crop_name} ({selectedFarmerListing.variety || "Standard"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Producing Farmer:</span>
                  <span className="font-semibold text-foreground">{selectedFarmerListing.farmer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Quantity:</span>
                  <span className="font-bold text-primary">
                    {Number(selectedFarmerListing.available_quantity ?? selectedFarmerListing.quantity ?? 0).toLocaleString()} {selectedFarmerListing.unit || "kg"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="font-bold text-foreground">₹{selectedFarmerListing.price || selectedFarmerListing.expected_price || 50} / {selectedFarmerListing.unit || "kg"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farm Location:</span>
                  <span>{selectedFarmerListing.location || selectedFarmerListing.region || "Andhra Pradesh"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_quantity">Order Quantity ({selectedFarmerListing.unit || "kg"}) *</Label>
                <Input
                  id="order_quantity"
                  type="number"
                  min="1"
                  max={Number(selectedFarmerListing.available_quantity ?? selectedFarmerListing.quantity ?? 1000)}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliv_start">Target Delivery Start</Label>
                  <Input
                    id="deliv_start"
                    type="date"
                    value={orderDeliveryStart}
                    onChange={(e) => setOrderDeliveryStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliv_end">Target Delivery End</Label>
                  <Input
                    id="deliv_end"
                    type="date"
                    value={orderDeliveryEnd}
                    onChange={(e) => setOrderDeliveryEnd(e.target.value)}
                  />
                </div>
              </div>

              {orderQuantity && !isNaN(Number(orderQuantity)) && (
                <div className="p-2.5 bg-primary/10 rounded-lg text-xs flex justify-between items-center">
                  <span>Estimated Total Value:</span>
                  <span className="font-bold text-sm text-primary">
                    ₹{(Number(orderQuantity) * (selectedFarmerListing.price || selectedFarmerListing.expected_price || 50)).toLocaleString()}
                  </span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFarmerListing(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={orderSubmitting} className="gap-1.5">
                  {orderSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm Bulk Order
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Fulfillment Update Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Update Fulfilled Quantity
            </DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <p>
                  <strong>Crop:</strong> {editingOrder.crop_name}
                </p>
                <p>
                  <strong>Total Ordered:</strong> {editingOrder.quantity_required} {editingOrder.unit}
                </p>
                <p>
                  <strong>Currently Fulfilled:</strong> {editingOrder.fulfilled_quantity} {editingOrder.unit} ({editingOrder.progress_percentage}%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fulfilled_input">
                  New Fulfilled Quantity ({editingOrder.unit}) *
                </Label>
                <Input
                  id="fulfilled_input"
                  type="number"
                  min="0"
                  max={editingOrder.quantity_required}
                  value={newFulfilledQty}
                  onChange={(e) => setNewFulfilledQty(e.target.value)}
                  placeholder={`0 to ${editingOrder.quantity_required}`}
                />
                <p className="text-[11px] text-muted-foreground">
                  Formula: Progress = (Fulfilled / {editingOrder.quantity_required}) × 100%
                </p>
              </div>

              {newFulfilledQty !== "" && !isNaN(Number(newFulfilledQty)) && (
                <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-xs">
                  <span className="text-foreground">
                    Projected Progress:{" "}
                    <strong>
                      {calculateMetrics(Number(newFulfilledQty), editingOrder.quantity_required).percentage}%
                    </strong>
                    {" "}(Remaining:{" "}
                    <strong>
                      {calculateMetrics(Number(newFulfilledQty), editingOrder.quantity_required).remaining} {editingOrder.unit}
                    </strong>)
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingOrder(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateFulfillment}
              disabled={updatingFulfillment}
              className="gap-1"
            >
              {updatingFulfillment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save Quantity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Bulk Order Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Custom Bulk Demand Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crop_name">Crop Name *</Label>
                <Input
                  id="crop_name"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Organic Cotton, Sona Masoori"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Guntur, Kurnool, Punjab"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Total Required Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 1000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg (Kilograms)</SelectItem>
                    <SelectItem value="quintal">Quintals</SelectItem>
                    <SelectItem value="ton">Tons</SelectItem>
                    <SelectItem value="bales">Bales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_start">Expected Delivery Start</Label>
                <Input
                  id="delivery_start"
                  type="date"
                  value={deliveryStart}
                  onChange={(e) => setDeliveryStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_end">Expected Delivery End</Label>
                <Input
                  id="delivery_end"
                  type="date"
                  value={deliveryEnd}
                  onChange={(e) => setDeliveryEnd(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Publish Demand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkOrders;
