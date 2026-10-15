import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, IndianRupee, Package, Wheat, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MarketItem {
  farmer_id: string;
  farmer_name: string;
  region: string | null;
  crop_name: string;
  total_yield: number;
  expected_price: number;
  farming_type: string;
}

const AgriMarket = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("price_asc");

  // Order modal state
  const [orderItem, setOrderItem] = useState<MarketItem | null>(null);
  const [orderQty, setOrderQty] = useState("");
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase
        .rpc("get_public_farmer_profiles");

      if (!profiles?.length) { setLoading(false); return; }

      const { data: details } = await supabase.from("farmer_details").select("*");
      const detailsMap = new Map((details || []).map((d: any) => [d.user_id, d]));

      const merged: MarketItem[] = profiles
        .filter((p) => detailsMap.has(p.id))
        .map((p) => {
          const d = detailsMap.get(p.id) as any;
          return {
            farmer_id: p.id,
            farmer_name: p.full_name,
            region: p.region,
            crop_name: d.primary_crop as string,
            total_yield: d.total_yield as number,
            expected_price: d.expected_price as number,
            farming_type: d.farming_type as string,
          };
        });

      setItems(merged);
      setLoading(false);
    };
    fetchData();
  }, []);

  const crops = useMemo(() => [...new Set(items.map((i) => i.crop_name))], [items]);
  const regions = useMemo(() => [...new Set(items.map((i) => i.region).filter(Boolean))], [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (cropFilter !== "all") result = result.filter((i) => i.crop_name === cropFilter);
    if (regionFilter !== "all") result = result.filter((i) => i.region === regionFilter);
    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.expected_price - b.expected_price);
    if (sortBy === "price_desc") result = [...result].sort((a, b) => b.expected_price - a.expected_price);
    if (sortBy === "yield_desc") result = [...result].sort((a, b) => b.total_yield - a.total_yield);
    if (sortBy === "yield_asc") result = [...result].sort((a, b) => a.total_yield - b.total_yield);
    return result;
  }, [items, cropFilter, regionFilter, sortBy]);

  const handlePlaceOrder = async () => {
    if (!user || !orderItem) return;
    const qty = parseFloat(orderQty);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setOrdering(true);
    const totalPrice = qty * orderItem.expected_price;

    const { error } = await supabase.from("orders").insert({
      consumer_id: user.id,
      farmer_id: orderItem.farmer_id,
      crop_id: orderItem.farmer_id, // placeholder
      crop_name: orderItem.crop_name,
      quantity: qty,
      price_per_kg: orderItem.expected_price,
      total_price: totalPrice,
      status: "pending",
    });

    setOrdering(false);
    if (error) {
      toast.error("Failed to place order: " + error.message);
      return;
    }
    toast.success(`Order placed for ${qty} kg of ${orderItem.crop_name}!`);
    setOrderItem(null);
    setOrderQty("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agri Market</h1>
        <p className="text-muted-foreground text-sm">Browse available crops from registered farmers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={cropFilter} onValueChange={setCropFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Crop" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crops</SelectItem>
            {crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((r) => <SelectItem key={r!} value={r!}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
            <SelectItem value="yield_desc">Yield: High → Low</SelectItem>
            <SelectItem value="yield_asc">Yield: Low → High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading market data...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No crops available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, idx) => (
            <Card key={`${item.farmer_id}-${idx}`} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-primary" /> {item.crop_name}
                  </CardTitle>
                  <Badge>{item.farming_type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.farmer_name}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Region</span>
                  <span>{item.region || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Available Yield</span>
                  <span>{item.total_yield} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Price/kg</span>
                  <span className="font-semibold">₹{item.expected_price}</span>
                </div>
                <Button
                  className="w-full mt-2"
                  size="sm"
                  onClick={() => { setOrderItem(item); setOrderQty(""); }}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" /> Request Order
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Modal */}
      <Dialog open={!!orderItem} onOpenChange={(open) => { if (!open) setOrderItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order — {orderItem?.crop_name}</DialogTitle>
          </DialogHeader>
          {orderItem && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Farmer: <span className="text-foreground font-medium">{orderItem.farmer_name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Price: <span className="text-foreground font-medium">₹{orderItem.expected_price}/kg</span>
              </div>
              <div className="space-y-2">
                <Label>Quantity (kg)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  placeholder="Enter quantity in kg"
                />
              </div>
              {orderQty && parseFloat(orderQty) > 0 && (
                <div className="bg-muted rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Price</span>
                    <span className="font-bold text-foreground">
                      ₹{(parseFloat(orderQty) * orderItem.expected_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderItem(null)}>Cancel</Button>
            <Button onClick={handlePlaceOrder} disabled={ordering}>
              {ordering ? "Placing..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgriMarket;
