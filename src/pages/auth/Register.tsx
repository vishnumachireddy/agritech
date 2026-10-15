import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_BASE } from "@/config";

const cropOptions = [
  "Rice", "Wheat", "Maize", "Sugarcane", "Cotton",
  "Soybean", "Groundnut", "Mustard", "Potato", "Tomato",
  "Onion", "Chilli", "Turmeric", "Banana", "Mango",
];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<string>("farmer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);

  // Farmer-specific fields
  const [primaryCrop, setPrimaryCrop] = useState("");
  const [secondaryCrop, setSecondaryCrop] = useState("");
  const [landArea, setLandArea] = useState("");
  const [totalYield, setTotalYield] = useState("");
  const [monthlyProduction, setMonthlyProduction] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [waterAvailability, setWaterAvailability] = useState("Medium");
  const [farmingType, setFarmingType] = useState("Mixed");
  const [harvestCycle, setHarvestCycle] = useState("Seasonal");

  // Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("");

  // Auto-detect location on mount for farmers
  useEffect(() => {
    if (role === "farmer" && navigator.geolocation) {
      setLocationStatus("Detecting location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationStatus(`📍 Location detected (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setLocationStatus("Location access denied — region will be saved manually.");
          setLatitude(null);
          setLongitude(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [role]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!phone.trim() || !region.trim()) {
      toast.error("Phone and Region are required");
      return;
    }
    if (role === "farmer" && (!primaryCrop || !landArea || !totalYield || !monthlyProduction || !expectedPrice)) {
      toast.error("Please fill all farming details");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        email,
        password,
        full_name: fullName,
        role,
        phone,
        region
      };

      if (role === "farmer") {
        payload.primary_crop = primaryCrop;
        payload.secondary_crop = secondaryCrop === "none" ? "" : secondaryCrop;
        payload.land_area = parseFloat(landArea) || 0;
        payload.total_yield = parseFloat(totalYield) || 0;
        payload.monthly_production = parseFloat(monthlyProduction) || 0;
        payload.expected_price = parseFloat(expectedPrice) || 0;
        payload.water_availability = waterAvailability;
        payload.farming_type = farmingType;
        payload.harvest_cycle = harvestCycle;
        if (latitude !== null && longitude !== null) {
          payload.latitude = latitude;
          payload.longitude = longitude;
        }
      }

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      login(data.user, data.token);
      toast.success("Account created successfully!");
      if (role === "consumer") {
        navigate("/consumer/dashboard");
      } else {
        navigate("/farmer/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full agri-gradient flex items-center justify-center mb-2">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <CardTitle className="font-display text-2xl">Create Account</CardTitle>
          <CardDescription>Join AgriAssist as a farmer or consumer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">🌾 Farmer</SelectItem>
                  <SelectItem value="consumer">🛒 Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region / District</Label>
              <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Nashik, Maharashtra" required />
            </div>

            {/* Farmer-specific Fields */}
            {role === "farmer" && (
              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">Farming Details</h3>

                {/* Location status */}
                {locationStatus && (
                  <p className="text-xs text-muted-foreground">{locationStatus}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Primary Crop</Label>
                    <Select value={primaryCrop} onValueChange={setPrimaryCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Crop (optional)</Label>
                    <Select value={secondaryCrop} onValueChange={setSecondaryCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {cropOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Land Area (acres)</Label>
                    <Input type="number" step="0.1" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="e.g. 5" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Yield (kg)</Label>
                    <Input type="number" step="1" value={totalYield} onChange={(e) => setTotalYield(e.target.value)} placeholder="e.g. 2000" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Production (kg)</Label>
                    <Input type="number" step="1" value={monthlyProduction} onChange={(e) => setMonthlyProduction(e.target.value)} placeholder="e.g. 500" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Price (₹/kg)</Label>
                    <Input type="number" step="0.5" value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} placeholder="e.g. 25" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Water Availability</Label>
                    <Select value={waterAvailability} onValueChange={setWaterAvailability}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Farming Type</Label>
                    <Select value={farmingType} onValueChange={setFarmingType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Organic">Organic</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                        <SelectItem value="Chemical">Chemical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Harvest Cycle</Label>
                    <Select value={harvestCycle} onValueChange={setHarvestCycle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
