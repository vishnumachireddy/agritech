import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ConsumerProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) {
        setProfile(prof);
        setDeliveryAddress((prof as any).delivery_address || "");
        setLatitude(prof.latitude?.toString() || "");
        setLongitude(prof.longitude?.toString() || "");
      }
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("consumer_id", user.id);
      setOrderCount(count ?? 0);
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updates: any = { delivery_address: deliveryAddress.trim() };
    if (latitude) updates.latitude = parseFloat(latitude);
    if (longitude) updates.longitude = parseFloat(longitude);

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingLocation(false);
        toast.success("Location detected");
      },
      () => {
        setDetectingLocation(false);
        toast.error("Unable to detect location");
      }
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  if (!profile) return <p className="text-muted-foreground">Loading profile...</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg">
      <h1 className="text-xl font-display font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Full Name</span><span>{profile.full_name}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email</span><span>{profile.email}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Region</span><span>{profile.region || "Not set"}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Orders</span><span>{orderCount}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Address & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <Input
              id="address"
              placeholder="Enter your full delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="any" placeholder="e.g. 28.6139" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="number" step="any" placeholder="e.g. 77.209" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={detectLocation} disabled={detectingLocation} className="gap-2">
            {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            Detect My Location
          </Button>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={handleLogout} className="gap-2">
        <LogOut className="w-4 h-4" /> Logout
      </Button>
    </div>
  );
};

export default ConsumerProfile;
