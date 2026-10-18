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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Calendar, Package, CheckCircle2, Truck, Box, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { API_BASE } from "@/config";

interface BulkOrder {
  id: string;
  crop_name: string;
  quantity_required: number;
  unit: string;
  region: string | null;
  expected_delivery_start: string | null;
  expected_delivery_end: string | null;
  status: string;
  created_at: string;
  total_committed: number;
  farmer_name?: string;
}

const BulkOrders = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [cropName, setCropName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [region, setRegion] = useState("");
  const [deliveryStart, setDeliveryStart] = useState("");
  const [deliveryEnd, setDeliveryEnd] = useState("");

  const fetchOrders = async () => {
    try {
      // Fetch from both bulk_orders and unified orders table
      const { data: bulkData } = await supabase.from("bulk_orders").select("*");
      let orderData: any[] = [];
      try {
        const orderRes = await fetch(`${API_BASE}/orders?consumer_id=${user?.id || ""}`);
        if (orderRes.ok) {
          orderData = await orderRes.json();
        }
      } catch (e) {}

      const bulkList = Array.isArray(bulkData) ? bulkData : [];
      const orderList = Array.isArray(orderData) ? orderData.filter((o: any) => o.is_bulk || o.order_type === "bulk") : [];

      const combinedMap = new Map<string, any>();

      bulkList.forEach((b: any) => {
        if (!user || !b.customer_id || b.customer_id === user.id || b.consumer_id === user.id) {
          combinedMap.set(b.id, b);
        }
      });

      orderList.forEach((o: any) => {
        const existing = combinedMap.get(o.id) || combinedMap.get(o.bulk_order_id);
        if (existing) {
          combinedMap.set(existing.id, {
            ...existing,
            ...o,
            status: o.status || existing.status,
            farmer_name: o.farmer_name || existing.farmer_name
          });
        } else {
          combinedMap.set(o.id, {
            id: o.id,
            customer_id: o.consumer_id || o.customer_id,
            consumer_id: o.consumer_id || o.customer_id,
            crop_name: o.crop_name,
            quantity_required: o.quantity,
            total_committed: o.quantity,
            unit: "kg",
            region: o.region || "Andhra Pradesh",
            status: o.status || "pending",
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
            crop_name: "Organic Sona Masoori Rice",
            quantity_required: 5000,
            unit: "kg",
            region: "Andhra Pradesh",
            expected_delivery_start: "2026-03-01",
            expected_delivery_end: "2026-03-15",
            status: "open",
            created_at: new Date().toISOString(),
            total_committed: 1500
          }
        ];
      }

      const processedOrders: BulkOrder[] = rawOrders.map((order: any) => ({
        id: order.id || "bulk-1",
        crop_name: order.crop_name || "Organic Crop",
        quantity_required: order.quantity_required || order.quantity || 5000,
        unit: order.unit || "kg",
        region: order.region || "Andhra Pradesh",
        expected_delivery_start: order.expected_delivery_start || "2026-03-01",
        expected_delivery_end: order.expected_delivery_end || "2026-03-15",
        status: order.status || "open",
        created_at: order.created_at || new Date().toISOString(),
        total_committed: order.total_committed || order.quantity_required || order.quantity || 1500,
        farmer_name: order.farmer_name
      }));

      // Sort by newest first
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

    // Listen to real-time WebSocket database events
    const handleDbChange = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.table === "bulk_orders" || detail.table === "orders" || detail.table === "bulk_requests" || detail.table === "farmer_commitments")) {
        fetchOrders();
      }
    };
    window.addEventListener("supabase_db_change", handleDbChange);

    // Set up realtime Supabase channel subscriptions
    const channel = supabase
      .channel("bulk_orders_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "farmer_commitments" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "bulk_orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => {
      window.removeEventListener("supabase_db_change", handleDbChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!cropName || !quantity || !unit) {
      toast.error(language === "te" ? "దయచేసి అన్ని వివరాలను నమోదు చేయండి" : "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const newOrderId = `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const parsedQty = parseFloat(quantity);

    try {
      // 1. Insert into bulk_orders
      await supabase.from("bulk_orders").insert({
        id: newOrderId,
        order_id: newOrderId,
        customer_id: user?.id || "consumer-demo-1",
        consumer_id: user?.id || "consumer-demo-1",
        crop_name: cropName,
        quantity_required: parsedQty,
        total_committed: 0,
        unit: unit,
        region: region || "Andhra Pradesh",
        expected_delivery_start: deliveryStart || "2026-03-01",
        expected_delivery_end: deliveryEnd || "2026-03-15",
        status: "open",
        order_type: "bulk",
        is_bulk: true
      });

      // 2. Insert into unified orders for farmers
      await supabase.from("orders").insert({
        id: newOrderId,
        consumer_id: user?.id || "consumer-demo-1",
        customer_id: user?.id || "consumer-demo-1",
        crop_name: cropName,
        quantity: parsedQty,
        price_per_kg: 50,
        total_price: parsedQty * 50,
        status: "open",
        order_type: "bulk",
        is_bulk: true,
        region: region || "Andhra Pradesh",
        bulk_order_id: newOrderId
      });

      toast.success(language === "te" ? "బల్క్ ఆర్డర్ విజయవంతంగా నమోదు చేయబడింది!" : "Bulk order created and listed in Market Demand!");
      setShowForm(false);
      resetForm();
      fetchOrders();
    } catch (err: any) {
      toast.error("Failed to create order: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCropName("");
    setQuantity("");
    setUnit("kg");
    setRegion("");
    setDeliveryStart("");
    setDeliveryEnd("");
  };

  const getPercentage = (committed: number, required: number) => {
    if (!required || required <= 0) return 0;
    return Math.min(Math.round((committed / required) * 100), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "fulfilled":
        return "bg-emerald-600 text-white hover:bg-emerald-700";
      case "out_for_delivery":
        return "bg-orange-600 text-white hover:bg-orange-700";
      case "packed":
        return "bg-purple-600 text-white hover:bg-purple-700";
      case "accepted":
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

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase();
    if (language === "te") {
      switch (s) {
        case "pending": return "పెండింగ్‌లో ఉంది";
        case "open": return "ఉత్పత్తి పురోగతిలో ఉంది (Open)";
        case "accepted": return "రైతు ఆమోదించారు (Accepted)";
        case "packed": return "ప్యాక్ చేయబడింది (Packed)";
        case "out_for_delivery": return "డెలివరీలో ఉంది 🚚";
        case "delivered":
        case "fulfilled": return "డెలివరీ పూర్తయింది ✅";
        case "rejected": return "తిరస్కరించబడింది";
        default: return status;
      }
    }
    switch (s) {
      case "pending": return "Pending Approval";
      case "open": return "Production in Progress";
      case "accepted": return "Accepted by Farmer";
      case "packed": return "Packed & Ready";
      case "out_for_delivery": return "Out for Delivery 🚚";
      case "delivered":
      case "fulfilled": return "Delivered ✅";
      case "rejected": return "Rejected";
      default: return status?.replace(/_/g, " ");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          {language === "te" ? "బల్క్ ఆర్డర్లు లోడ్ అవుతున్నాయి..." : "Loading bulk orders..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {language === "te" ? "బల్క్ ఆర్డర్లు (Bulk Orders)" : "Bulk Orders"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "te" 
              ? "మీ బల్క్ ఆర్డర్లు మరియు రైతు స్థితి అప్‌డేట్‌లను ఇక్కడ ప్రత్యక్షంగా ట్రాక్ చేయండి" 
              : "Monitor your bulk orders and farmer production progress in real time"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> {language === "te" ? "కొత్త బల్క్ ఆర్డర్" : "New Bulk Order"}
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">
              {language === "te" ? "ఇంకా బల్క్ ఆర్డర్లు లేవు" : "No bulk orders yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === "te" ? "రైతుల నుండి ప్రత్యక్షంగా సరఫరా పొందడానికి బల్క్ ఆర్డర్ సృష్టించండి" : "Create a bulk order to attract farmers for production"}
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              {language === "te" ? "మొదటి బల్క్ ఆర్డర్ సృష్టించండి" : "Create Your First Bulk Order"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" /> {order.crop_name}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <MapPin className="w-3 h-3" /> {order.region}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} font-medium shadow-sm transition-all`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {language === "te" ? "లక్ష్యం పరిమాణం" : "Target Quantity"}
                    </p>
                    <p className="font-semibold text-base">{order.quantity_required} {order.unit}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-muted-foreground text-xs">
                      {order.farmer_name ? (language === "te" ? "రైతు" : "Farmer") : (language === "te" ? "రైతుల నిబద్ధత" : "Farmers Committed")}
                    </p>
                    <p className="font-semibold text-base text-primary">
                      {order.farmer_name ? order.farmer_name : `${order.total_committed} ${order.unit}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-primary">
                      {order.status === "delivered" || order.status === "fulfilled"
                        ? "100% " + (language === "te" ? "పూర్తయింది" : "Fulfilled")
                        : `${getPercentage(order.total_committed, order.quantity_required)}% ` + (language === "te" ? "నిబద్ధత" : "Committed")}
                    </span>
                    <span className="text-muted-foreground italic">
                      {order.expected_delivery_end 
                        ? `${language === "te" ? "ముగింపు అంచనా" : "Est. Completion"}: ${new Date(order.expected_delivery_end).toLocaleDateString()}` 
                        : (language === "te" ? "తేదీ నిర్ణయించబడలేదు" : "No end date set")}
                    </span>
                  </div>
                  <Progress 
                    value={order.status === "delivered" || order.status === "fulfilled" ? 100 : getPercentage(order.total_committed, order.quantity_required)} 
                    className="h-2" 
                  />
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {order.expected_delivery_start ? new Date(order.expected_delivery_start).toLocaleDateString() : 'TBD'} - {order.expected_delivery_end ? new Date(order.expected_delivery_end).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">
                    #{order.id.slice(0, 8)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Bulk Order Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Bulk Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crop_name">Crop Name *</Label>
                <Input id="crop_name" value={cropName} onChange={(e) => setCropName(e.target.value)} placeholder="e.g. Cotton, Rice" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Kurnool, Punjab" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Required *</Label>
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="ton">Tons</SelectItem>
                    <SelectItem value="quintal">Quintals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Expected Delivery Start</Label>
                <Input id="start_date" type="date" value={deliveryStart} onChange={(e) => setDeliveryStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Expected Delivery End</Label>
                <Input id="end_date" type="date" value={deliveryEnd} onChange={(e) => setDeliveryEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Bulk Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkOrders;
