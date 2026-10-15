import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Calendar, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
}

const BulkOrders = () => {
  const { user } = useAuth();
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
    if (orders.length === 0) setLoading(true);
    try {
      // Fetch bulk orders
      const { data: ordersData } = await supabase.from("bulk_orders").select("*");

      let rawOrders = Array.isArray(ordersData) ? ordersData : [];

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
          }
        ];
      }

      const processedOrders: BulkOrder[] = rawOrders.map((order: any) => {
        return {
          id: order.id || "bulk-1",
          crop_name: order.crop_name || "Organic Crop",
          quantity_required: order.quantity_required || 5000,
          unit: order.unit || "kg",
          region: order.region || "Andhra Pradesh",
          expected_delivery_start: order.expected_delivery_start || "2026-03-01",
          expected_delivery_end: order.expected_delivery_end || "2026-03-15",
          status: order.status || "open",
          created_at: order.created_at || new Date().toISOString(),
          total_committed: order.total_committed || 1500
        };
      });

      setOrders(processedOrders);
    } catch (err) {
      console.error("fetchOrders error in BulkOrders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel("bulk_orders_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "farmer_commitments" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "bulk_orders" }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!cropName || !quantity || !unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("bulk_orders").insert({
      customer_id: user?.id || "consumer-demo-1",
      crop_name: cropName,
      quantity_required: parseFloat(quantity),
      unit: unit,
      region: region || "Andhra Pradesh",
      expected_delivery_start: deliveryStart || "2026-03-01",
      expected_delivery_end: deliveryEnd || "2026-03-15",
      status: "open",
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to create order: " + error.message);
      return;
    }

    toast.success("Bulk order created and listed in Market Demand!");
    setShowForm(false);
    resetForm();
    fetchOrders();
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
    return Math.min(Math.round((committed / required) * 100), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled": return "bg-green-500 text-white";
      case "open": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading bulk orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Bulk Orders</h1>
          <p className="text-sm text-muted-foreground">Monitor your bulk orders and farmer production progress</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Bulk Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No bulk orders yet</h3>
            <p className="text-muted-foreground mb-6">Create a bulk order to attract farmers for production</p>
            <Button onClick={() => setShowForm(true)} variant="outline">Create Your First Bulk Order</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{order.crop_name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <MapPin className="w-3 h-3" /> {order.region}
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status === "open" ? "Production in Progress" : order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Target Quantity</p>
                    <p className="font-semibold">{order.quantity_required} {order.unit}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-muted-foreground">Farmers Committed</p>
                    <p className="font-semibold">{order.total_committed} {order.unit}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-primary">{getPercentage(order.total_committed, order.quantity_required)}% Fulfilled</span>
                    <span className="text-muted-foreground italic">
                      {order.expected_delivery_end ? `Est. Completion: ${new Date(order.expected_delivery_end).toLocaleDateString()}` : "No end date set"}
                    </span>
                  </div>
                  <Progress value={getPercentage(order.total_committed, order.quantity_required)} className="h-2" />
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Delivery window: {order.expected_delivery_start ? new Date(order.expected_delivery_start).toLocaleDateString() : 'TBD'} - {order.expected_delivery_end ? new Date(order.expected_delivery_end).toLocaleDateString() : 'TBD'}</span>
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
