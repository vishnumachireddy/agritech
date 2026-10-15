import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plane, CheckCircle2, Clock, MapPin, Calendar, Phone, ShieldAlert, Sparkles, XCircle, Wrench, AlertTriangle } from "lucide-react";
import { API_BASE } from "@/config";

interface Provider {
  id: string;
  provider_name: string;
  service_type: string;
  phone: string;
  rate_per_acre: number;
  service_region: string;
  is_available: boolean;
  rating: number;
}

interface SprayBooking {
  id: string;
  booking_id: string;
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

const DroneBooking = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bookings, setBookings] = useState<SprayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [sprayType, setSprayType] = useState("Drone Spray");
  const [crop, setCrop] = useState("Organic Sona Masoori Rice");
  const [fieldArea, setFieldArea] = useState("3.5");
  const [bookingDate, setBookingDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [preferredTime, setPreferredTime] = useState("Morning (07:00 AM - 10:00 AM)");
  const [contactNumber, setContactNumber] = useState("+91 9876543210");
  const [fieldLocation, setFieldLocation] = useState("Kurnool, Andhra Pradesh");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const estimatedCost = selectedProvider && parseFloat(fieldArea) > 0
    ? roundTwoDecimals(parseFloat(fieldArea) * selectedProvider.rate_per_acre)
    : 0;

  function roundTwoDecimals(val: number) {
    return Math.round(val * 100) / 100;
  }

  const fetchData = async () => {
    try {
      // 1. Fetch Spray Providers
      const serviceTypeFilter = sprayType === "Drone Spray" ? "Drone" : "Pump";
      const providersRes = await fetch(`${API_BASE}/spray-providers?service_type=${serviceTypeFilter}`);
      let providerList: Provider[] = [];
      if (providersRes.ok) {
        providerList = await providersRes.json();
      }

      if (providerList.length === 0) {
        providerList = [
          {
            id: "provider-sp-101",
            provider_name: "AgriFly Precision Drones",
            service_type: "Drone",
            phone: "+91 98765 43210",
            rate_per_acre: 550.0,
            service_region: "Andhra Pradesh",
            is_available: true,
            rating: 4.9
          },
          {
            id: "provider-sp-102",
            provider_name: "Kisan Motorized Heavy Spray Services",
            service_type: "Pump",
            phone: "+91 98123 45678",
            rate_per_acre: 350.0,
            service_region: "Andhra Pradesh",
            is_available: true,
            rating: 4.7
          }
        ];
      }
      setProviders(providerList);
      if (providerList.length > 0 && !selectedProviderId) {
        setSelectedProviderId(providerList[0].id);
      }

      // 2. Fetch Farmer Bookings
      const farmerId = user?.id || "farmer-demo-1";
      const bookingsRes = await fetch(`${API_BASE}/drone-bookings?farmer_id=${farmerId}`);
      if (bookingsRes.ok) {
        const bookingsList = await bookingsRes.json();
        setBookings(Array.isArray(bookingsList) ? bookingsList : []);
      }
    } catch (err) {
      console.error("fetchData error in DroneBooking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to unified realtime DB events
    const handleDbChange = (event: any) => {
      const table = event?.detail?.table;
      if (table === "drone_bookings" || table === "spray_providers") {
        fetchData();
      }
    };

    window.addEventListener("supabase_db_change", handleDbChange);
    return () => {
      window.removeEventListener("supabase_db_change", handleDbChange);
    };
  }, [user, sprayType]);

  const handleSubmitBooking = async () => {
    if (!fieldArea || parseFloat(fieldArea) <= 0) {
      toast.error("Please enter a valid field area (> 0)");
      return;
    }
    if (!selectedProviderId) {
      toast.error("Please select a spray service provider");
      return;
    }
    if (!contactNumber || contactNumber.length < 10) {
      toast.error("Please provide a valid contact number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/drone-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spray_type: sprayType,
          crop: crop,
          field_area: parseFloat(fieldArea),
          area_unit: "Acres",
          booking_date: bookingDate,
          preferred_time: preferredTime,
          farmer_contact: contactNumber,
          field_location: fieldLocation,
          additional_notes: additionalNotes,
          provider_id: selectedProviderId,
          farmer_id: user?.id || "farmer-demo-1",
          farmer_name: user?.user_metadata?.full_name || "Ramesh Kumar"
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create booking");
      }

      toast.success("Spray Service Booking confirmed! Provider notified live.");
      setAdditionalNotes("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`${API_BASE}/drone-bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", notes: "Cancelled by farmer" })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Could not cancel booking");
      }
      toast.success("Booking cancelled.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><Clock className="w-3 h-3" /> PENDING PROVIDER ACCEPTANCE</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> ACCEPTED BY PROVIDER</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-indigo-500/15 text-indigo-600 border-indigo-500/30 gap-1"><Calendar className="w-3 h-3" /> CREW SCHEDULED</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 gap-1 animate-pulse"><Plane className="w-3 h-3" /> SPRAYING IN PROGRESS</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> SPRAYING COMPLETED ✓</Badge>;
      case "REJECTED":
        return <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><XCircle className="w-3 h-3" /> REJECTED BY PROVIDER</Badge>;
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
        <span className="ml-2 text-muted-foreground">Loading Spraying Module...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">Drone & Pump Spray Booking</h1>
          </div>
          <p className="text-sm text-muted-foreground">Book precision aerial drones or heavy motorized pumps with live status updates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking Form (7 Cols) */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Create Spraying Request
            </CardTitle>
            <CardDescription>Fill in field specifications to receive instant backend cost estimates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spray_type">Spray Service Type *</Label>
                <Select value={sprayType} onValueChange={(val) => { setSprayType(val); setSelectedProviderId(""); }}>
                  <SelectTrigger id="spray_type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Drone Spray">🛸 Drone Aerial Spray</SelectItem>
                    <SelectItem value="Pump Spray">🚜 Motorized Heavy Pump Spray</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crop">Crop Name *</Label>
                <Select value={crop} onValueChange={setCrop}>
                  <SelectTrigger id="crop"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Organic Sona Masoori Rice">Organic Sona Masoori Rice</SelectItem>
                    <SelectItem value="Raw Cotton Bales">Raw Cotton Bales</SelectItem>
                    <SelectItem value="Sharbati Wheat">Sharbati Wheat</SelectItem>
                    <SelectItem value="Hybrid Maize">Hybrid Maize</SelectItem>
                    <SelectItem value="Red Chili">Red Chili</SelectItem>
                    <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_area">Field Area (Acres) *</Label>
                <Input
                  id="field_area"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(e.target.value)}
                  placeholder="e.g. 3.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_date">Preferred Date *</Label>
                <Input
                  id="booking_date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_time">Time Slot *</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger id="preferred_time"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning (07:00 AM - 10:00 AM)">Morning (07:00 AM - 10:00 AM)</SelectItem>
                    <SelectItem value="Mid-day (10:00 AM - 01:00 PM)">Mid-day (10:00 AM - 01:00 PM)</SelectItem>
                    <SelectItem value="Evening (03:00 PM - 06:00 PM)">Evening (03:00 PM - 06:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Farmer Phone Number *</Label>
                <Input
                  id="contact"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Field Location / Address *</Label>
              <Input
                id="location"
                value={fieldLocation}
                onChange={(e) => setFieldLocation(e.target.value)}
                placeholder="e.g. Kurnool Sector 4, Andhra Pradesh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes / Crop Disease Instructions</Label>
              <Textarea
                id="notes"
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Low altitude spraying required for leaf blight control..."
              />
            </div>

            {/* Provider Selection */}
            <div className="space-y-2 pt-2">
              <Label className="font-bold text-foreground">Select Service Provider *</Label>
              <div className="space-y-2">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProviderId(p.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedProviderId === p.id
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.provider_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Service: <span className="font-medium text-foreground">{p.service_type}</span> • Rating: ★ {p.rating}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">₹{p.rate_per_acre} <span className="text-xs text-muted-foreground font-normal">/ acre</span></p>
                      <Badge variant="outline" className="text-[10px]">Verified Operator</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Summary Box */}
            {selectedProvider && (
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Field Area:</span>
                  <span className="font-semibold text-foreground">{fieldArea} Acres</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Operator Rate:</span>
                  <span className="font-semibold text-foreground">₹{selectedProvider.rate_per_acre} / acre</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center">
                  <span className="font-bold text-foreground">Estimated Total Cost:</span>
                  <span className="text-xl font-display font-bold text-primary">₹{estimatedCost}</span>
                </div>
              </div>
            )}

            <Button onClick={handleSubmitBooking} disabled={submitting} className="w-full gap-2 text-base font-semibold py-6">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {submitting ? "Processing Booking..." : "Confirm & Submit Booking"}
            </Button>
          </CardContent>
        </Card>

        {/* Live Booking Status Dashboard (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Live Booking Tracker
              </CardTitle>
              <CardDescription>Real-time updates broadcast directly from operator via WebSockets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Wrench className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No active spray requests. Submit a form to track status live.
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{b.spray_type}</span>
                        <h4 className="font-bold text-foreground text-base">{b.crop}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-muted-foreground">{b.booking_id}</span>
                    </div>

                    <div>{getStatusBadge(b.status)}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                      <div>
                        <span className="block font-medium text-foreground">Area: {b.field_area} Acres</span>
                        <span>Date: {new Date(b.booking_date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-primary">₹{b.estimated_cost} Total</span>
                        <span>Rate: ₹{b.provider_rate}/acre</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3 text-primary" /> Provider: <span className="font-semibold text-foreground">{b.provider_name}</span> ({b.provider_phone})
                      </p>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3 text-primary" /> Location: <span className="text-foreground">{b.field_location}</span>
                      </p>
                    </div>

                    {b.status === "PENDING" && (
                      <Button variant="outline" size="sm" onClick={() => handleCancelBooking(b.id)} className="w-full text-xs text-destructive hover:bg-destructive/10">
                        Cancel Booking Request
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DroneBooking;
