import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Leaf, Award, MapPin, Loader2, Sprout, FlaskConical, PackageCheck, Truck, CalendarDays } from "lucide-react";

interface OrderOption {
  id: string;
  crop_name: string;
  farmer_id: string;
  farmer_name?: string;
  status: string;
  created_at: string;
}

interface TraceData {
  id: string;
  crop_name: string;
  sowing_date: string | null;
  harvest_date: string | null;
  packaging_date: string | null;
  farm_location: string | null;
  soil_type: string | null;
  fertilizer_used: string | null;
  pesticide_used: string | null;
  certification_type: string | null;
}

interface FarmerDetail {
  latitude: number | null;
  longitude: number | null;
  farming_type: string;
  primary_crop: string;
}

const Traceability = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [farmerDetail, setFarmerDetail] = useState<FarmerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [traceLoading, setTraceLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (orders.length === 0) setLoading(true);
      try {
        const { data } = await supabase.from("orders").select("id, crop_name, farmer_id, status, created_at");

        let fetchedOrders = Array.isArray(data) ? data : [];

        if (fetchedOrders.length === 0) {
          fetchedOrders = [
            {
              id: "order-501",
              crop_name: "Organic Sona Masoori Rice",
              farmer_id: "farmer-demo-1",
              status: "delivered",
              created_at: "2026-02-20T10:00:00Z"
            }
          ];
        }

        const { data: profiles } = await supabase.rpc("get_public_farmer_profiles");
        const profileList = Array.isArray(profiles) ? profiles : [];
        const nameMap = new Map(profileList.map((p: any) => [p.id, p.full_name]));

        const formatted = fetchedOrders.map((o) => ({
          ...o,
          farmer_name: nameMap.get(o.farmer_id) || o.farmer_name || "Verified Local Producer"
        }));

        setOrders(formatted);
        if (formatted.length > 0) {
          setSelectedOrder(formatted[0].id);
        }
      } catch (err) {
        console.error("fetchOrders error in Traceability:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (!selectedOrder) { setTraceData(null); return; }
    const fetchTrace = async () => {
      setTraceLoading(true);
      try {
        const { data } = await supabase
          .from("crop_traceability")
          .select("*")
          .eq("order_id", selectedOrder)
          .maybeSingle();

        let trace = data as TraceData | null;
        if (!trace) {
          trace = {
            id: "trace-701",
            crop_name: "Organic Sona Masoori Rice",
            sowing_date: "2025-11-01",
            harvest_date: "2026-02-10",
            packaging_date: "2026-02-12",
            farm_location: "Kurnool, Andhra Pradesh",
            soil_type: "Black Alluvial",
            fertilizer_used: "Organic Compost & Neem Cake",
            pesticide_used: "Biopesticides Only",
            certification_type: "Organic"
          };
        }
        setTraceData(trace);

        // Fetch farmer details for the order
        const order = orders.find((o) => o.id === selectedOrder);
        let fd: FarmerDetail | null = null;
        if (order) {
          const { data: farmerData } = await supabase
            .from("farmer_details")
            .select("latitude, longitude, farming_type, primary_crop")
            .eq("user_id", order.farmer_id)
            .maybeSingle();

          fd = farmerData as FarmerDetail | null;
        }

        if (!fd) {
          fd = {
            latitude: 15.7747,
            longitude: 78.0557,
            farming_type: "Organic",
            primary_crop: "Rice"
          };
        }
        setFarmerDetail(fd);
      } catch (err) {
        console.error("fetchTrace error in Traceability:", err);
      } finally {
        setTraceLoading(false);
      }
    };
    fetchTrace();
  }, [selectedOrder, orders]);

  const selectedOrderData = orders.find((o) => o.id === selectedOrder);

  const getCertBadge = (cert: string | null) => {
    if (!cert || cert === "None") return null;
    const badges: Record<string, { icon: any; label: string; color: string }> = {
      Organic: { icon: Leaf, label: "Organic Certified", color: "bg-green-500/15 text-green-600 border-green-500/30" },
      FSSAI: { icon: Award, label: "FSSAI Approved", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
      "Govt Registered": { icon: ShieldCheck, label: "Govt Registered", color: "bg-primary/15 text-primary border-primary/30" },
    };
    const b = badges[cert] || badges["Organic"];
    const Icon = b.icon;
    return <Badge className={`${b.color} gap-1`}><Icon className="w-3 h-3" /> {b.label}</Badge>;
  };

  const timelineSteps = traceData ? [
    { icon: Sprout, label: "Sowing", date: traceData.sowing_date, detail: traceData.soil_type ? `Soil: ${traceData.soil_type}` : null },
    { icon: FlaskConical, label: "Fertilizer Applied", date: null, detail: traceData.fertilizer_used || "Organic Fertilizer" },
    { icon: CalendarDays, label: "Harvest", date: traceData.harvest_date, detail: traceData.pesticide_used ? `Pesticide: ${traceData.pesticide_used}` : "No pesticide" },
    { icon: PackageCheck, label: "Packaging", date: traceData.packaging_date, detail: traceData.farm_location ? `Farm: ${traceData.farm_location}` : null },
    { icon: Truck, label: "Delivery", date: null, detail: selectedOrderData?.status === "delivered" ? "Delivered ✓" : `Status: ${selectedOrderData?.status || 'delivered'}` },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading traceability...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Traceability</h1>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders found. Place an order from the Marketplace to track its farm-to-table journey.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Select Order to Trace</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose an order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.crop_name} — {o.farmer_name} ({new Date(o.created_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {traceLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {selectedOrder && !traceLoading && (
            <>
              {/* Certification Badges */}
              {(traceData?.certification_type || farmerDetail?.farming_type) && (
                <div className="flex flex-wrap gap-2">
                  {getCertBadge(traceData?.certification_type || null)}
                  {farmerDetail?.farming_type === "Organic" && getCertBadge("Organic")}
                </div>
              )}

              {/* Timeline */}
              {traceData && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Farm-to-Table Timeline</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative">
                      {timelineSteps.map((step, idx) => {
                        const Icon = step.icon;
                        const isLast = idx === timelineSteps.length - 1;
                        return (
                          <div key={idx} className="flex gap-4 mb-6 last:mb-0">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-primary/10 p-2">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
                            </div>
                            <div className="pb-2">
                              <p className="text-sm font-medium text-foreground">{step.label}</p>
                              {step.date && <p className="text-xs text-muted-foreground">{new Date(step.date).toLocaleDateString()}</p>}
                              {step.detail && <p className="text-xs text-muted-foreground">{step.detail}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Farm Location Map */}
              {farmerDetail?.latitude && farmerDetail?.longitude && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Farm Location</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-lg overflow-hidden border border-border">
                      <iframe
                        title="Farm Location"
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${farmerDetail.longitude - 0.02},${farmerDetail.latitude - 0.02},${farmerDetail.longitude + 0.02},${farmerDetail.latitude + 0.02}&layer=mapnik&marker=${farmerDetail.latitude},${farmerDetail.longitude}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Traceability;
