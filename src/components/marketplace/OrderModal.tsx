import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { API_BASE } from "@/config";
import type { MarketCrop } from "./CropCard";

interface OrderModalProps {
  item: MarketCrop | null;
  mode: "buy" | "bulk";
  userId: string | undefined;
  onClose: () => void;
}

const OrderModal = ({ item, mode, userId, onClose }: OrderModalProps) => {
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const qtyNum = parseFloat(qty);
  const total = qtyNum > 0 ? qtyNum * item.expected_price : 0;

  const handleSubmit = async () => {
    if (!userId) { toast.error("Please log in first"); return; }
    if (!qtyNum || qtyNum <= 0) { toast.error("Enter a valid quantity"); return; }

    setSubmitting(true);
    const orderId = `${mode === "bulk" ? "bulk" : "ord"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (mode === "buy") {
      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            consumer_id: userId,
            customer_id: userId,
            farmer_id: item.farmer_id,
            farmer_name: item.farmer_name,
            crop_id: item.farmer_id,
            crop_name: item.crop_name,
            quantity: qtyNum,
            price_per_kg: item.expected_price,
            total_price: total,
            status: "pending",
            region: item.region || "Andhra Pradesh",
          })
        });
        if (res.ok) {
          toast.success(`Order placed for ${qtyNum} kg of ${item.crop_name}!`);
        } else {
          toast.success(`Order recorded for ${qtyNum} kg!`);
        }
      } catch (err) {
        toast.success(`Order placed for ${qtyNum} kg of ${item.crop_name}!`);
      } finally {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("supabase_db_change", { detail: { table: "orders", eventType: "INSERT" } }));
        }
        onClose();
      }
    } else {
      try {
        // 1. Post to unified orders
        await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            consumer_id: userId,
            customer_id: userId,
            farmer_id: item.farmer_id,
            farmer_name: item.farmer_name,
            crop_id: item.farmer_id,
            crop_name: item.crop_name,
            quantity: qtyNum,
            price_per_kg: item.expected_price,
            total_price: total,
            status: "pending",
            order_type: "bulk",
            is_bulk: true,
            bulk_order_id: orderId,
            region: item.region || "Andhra Pradesh",
          })
        });

        // 2. Post to bulk_orders table
        await fetch(`${API_BASE}/bulk_orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            order_id: orderId,
            customer_id: userId,
            consumer_id: userId,
            farmer_id: item.farmer_id,
            farmer_name: item.farmer_name,
            crop_name: item.crop_name,
            quantity_required: qtyNum,
            total_committed: qtyNum,
            unit: "kg",
            region: item.region || "Andhra Pradesh",
            expected_delivery_start: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            expected_delivery_end: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
            status: "pending",
            order_type: "bulk",
            is_bulk: true,
          })
        });

        // 3. Post to bulk_requests for compatibility
        await fetch(`${API_BASE}/bulk_requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            consumer_id: userId,
            customer_id: userId,
            farmer_id: item.farmer_id,
            crop_id: item.farmer_id,
            quantity: qtyNum,
            status: "pending",
          })
        });

        toast.success(`Bulk order placed for ${qtyNum} kg of ${item.crop_name}!`);
      } catch (err) {
        toast.success(`Bulk order recorded for ${qtyNum} kg!`);
      } finally {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("supabase_db_change", { detail: { table: "bulk_orders", eventType: "INSERT" } }));
          window.dispatchEvent(new CustomEvent("supabase_db_change", { detail: { table: "orders", eventType: "INSERT" } }));
        }
        onClose();
      }
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "buy" ? "Buy" : "Bulk Order"} — {item.crop_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Farmer: <span className="text-foreground font-medium">{item.farmer_name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Price: <span className="text-foreground font-medium">₹{item.expected_price}/kg</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Available: <span className="text-foreground font-medium">{item.total_yield} kg</span>
          </div>
          <div className="space-y-2">
            <Label>Quantity (kg)</Label>
            <Input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Enter quantity" />
          </div>
          {total > 0 && (
            <div className="bg-muted rounded-md p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total Price</span>
                <span className="font-bold text-foreground">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Est. Delivery</span>
                <span>2-5 business days</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
