import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plane, CheckCircle2, Clock, MapPin, Calendar, Phone, ShieldCheck, XCircle, Play, AlertTriangle } from "lucide-react";
import { API_BASE } from "@/config";

interface SprayBooking {
  id: string;
  booking_id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  spray_type: string;
  crop: string;
  field_area: number;
  area_unit: string;
  booking_date: string;
  preferred_time: string;
  field_location: string;
  additional_notes?: string;
  provider_id: string;
  provider_name: string;
  provider_phone: string;
  provider_rate: number;
  estimated_cost: number;
  status: string;
  created_at: string;
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<SprayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProviderBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/drone-bookings`);
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("fetchProviderBookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderBookings();

    // Listen to unified realtime DB events
    const handleDbChange = (event: any) => {
      const table = event?.detail?.table;
      if (table === "drone_bookings" || table === "spray_providers") {
        fetchProviderBookings();
      }
    };

    window.addEventListener("supabase_db_change", handleDbChange);
    return () => {
      window.removeEventListener("supabase_db_change", handleDbChange);
    };
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`${API_BASE}/drone-bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update booking status");
      }

      toast.success(`Booking status updated to ${newStatus}. Live WebSocket update sent to farmer!`);
      fetchProviderBookings();
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><Clock className="w-3 h-3" /> PENDING</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> ACCEPTED</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-indigo-500/15 text-indigo-600 border-indigo-500/30 gap-1"><Calendar className="w-3 h-3" /> SCHEDULED</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 gap-1 animate-pulse"><Plane className="w-3 h-3" /> IN PROGRESS</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> COMPLETED</Badge>;
      case "REJECTED":
        return <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><XCircle className="w-3 h-3" /> REJECTED</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="gap-1"><XCircle className="w-3 h-3" /> CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Provider Dispatch Portal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">Spray Provider Operations Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage incoming field spraying requests and broadcast live progress to farmers</p>
        </div>
        <Badge variant="outline" className="text-xs py-1 px-3">Operator Role Active</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.length === 0 ? (
          <Card className="col-span-2 border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Plane className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-base">No spray bookings assigned</p>
              <p className="text-xs mt-1">New farmer spray requests will appear here in real-time.</p>
            </CardContent>
          </Card>
        ) : (
          bookings.map((b) => (
            <Card key={b.id} className="overflow-hidden border-border/80 hover:border-primary/50 transition-colors shadow-sm">
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary">{b.spray_type}</span>
                    <CardTitle className="text-lg font-bold">{b.crop}</CardTitle>
                    <CardDescription className="text-xs">Farmer: <span className="font-semibold text-foreground">{b.farmer_name}</span> ({b.farmer_phone})</CardDescription>
                  </div>
                  <div>{getStatusBadge(b.status)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div>
                    <span className="text-muted-foreground block">Field Area:</span>
                    <span className="font-bold text-foreground text-sm">{b.field_area} Acres</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Estimated Revenue:</span>
                    <span className="font-bold text-primary text-sm">₹{b.estimated_cost}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Scheduled Date:</span>
                    <span className="font-medium text-foreground">{new Date(b.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Time Window:</span>
                    <span className="font-medium text-foreground">{b.preferred_time}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> <span className="font-semibold text-foreground">Location:</span> {b.field_location}
                  </p>
                  {b.additional_notes && (
                    <p className="bg-amber-500/10 text-amber-700 p-2 rounded border border-amber-500/20 text-xs">
                      <strong>Notes:</strong> {b.additional_notes}
                    </p>
                  )}
                </div>

                {/* Operator Actions State Machine Controls */}
                <div className="pt-2 border-t flex flex-wrap gap-2">
                  {b.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        disabled={updatingId === b.id}
                        onClick={() => handleUpdateStatus(b.id, "ACCEPTED")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        {updatingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Accept Request
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === b.id}
                        onClick={() => handleUpdateStatus(b.id, "REJECTED")}
                        className="flex-1 text-destructive hover:bg-destructive/10 gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </>
                  )}

                  {b.status === "ACCEPTED" && (
                    <Button
                      size="sm"
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, "SCHEDULED")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                    >
                      {updatingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                      Schedule Operator Crew
                    </Button>
                  )}

                  {b.status === "SCHEDULED" && (
                    <Button
                      size="sm"
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, "IN_PROGRESS")}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-1"
                    >
                      {updatingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Start Spraying Service
                    </Button>
                  )}

                  {b.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      {updatingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Mark Spraying Completed
                    </Button>
                  )}

                  {(b.status === "COMPLETED" || b.status === "REJECTED" || b.status === "CANCELLED") && (
                    <span className="text-xs italic text-muted-foreground w-full text-center py-1">
                      Service Lifecycle Finalized ({b.status})
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderBookings;
