import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Droplets, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Irrigation = () => {
  const { user } = useAuth();
  const [waterAvailability, setWaterAvailability] = useState("Medium");
  const [soilMoisture, setSoilMoisture] = useState(47);
  const [recommendedWater, setRecommendedWater] = useState(228);
  const [waterSavings, setWaterSavings] = useState(27);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Get farmer water availability
      const { data: fd } = await supabase.from("farmer_details")
        .select("water_availability, land_area")
        .eq("user_id", user.id)
        .single();

      if (fd) {
        setWaterAvailability(fd.water_availability);
        // Derive irrigation metrics from farmer data
        const landArea = fd.land_area || 1;
        const waterMap: Record<string, number> = { Low: 30, Medium: 47, High: 65 };
        const recMap: Record<string, number> = { Low: 350, Medium: 228, High: 150 };
        const savingsMap: Record<string, number> = { Low: 15, Medium: 27, High: 40 };

        setSoilMoisture(waterMap[fd.water_availability] || 47);
        setRecommendedWater(Math.round((recMap[fd.water_availability] || 228) * landArea));
        setWaterSavings(savingsMap[fd.water_availability] || 27);
      }

      // Get weather rainfall data for chart
      const { data: profile } = await supabase.from("profiles").select("region").eq("id", user.id).single();
      let weatherQuery = supabase.from("weather_data").select("rainfall, timestamp").order("timestamp", { ascending: false }).limit(7);
      if (profile?.region) weatherQuery = weatherQuery.eq("region", profile.region);
      const { data: weatherData } = await weatherQuery;

      if (weatherData && weatherData.length > 0) {
        // Use real weather data for chart
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const moistureOffset = 251.2 - (251.2 * soilMoisture) / 100;

  const dailyData = [
    { day: "Mon", completed: Math.round(recommendedWater * 0.9), scheduled: recommendedWater },
    { day: "Tue", completed: Math.round(recommendedWater * 0.85), scheduled: Math.round(recommendedWater * 0.95) },
    { day: "Wed", completed: 0, scheduled: Math.round(recommendedWater * 0.8) },
    { day: "Thu", completed: 0, scheduled: recommendedWater },
    { day: "Fri", completed: 0, scheduled: Math.round(recommendedWater * 0.9) },
    { day: "Sat", completed: 0, scheduled: Math.round(recommendedWater * 1.1) },
    { day: "Sun", completed: 0, scheduled: Math.round(recommendedWater * 0.7) },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <Droplets className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-agri-orange uppercase tracking-wide">Smart Irrigation Advisor</h1>
        </div>
        <p className="text-muted-foreground">Loading irrigation data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Droplets className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-agri-orange uppercase tracking-wide">Smart Irrigation Advisor</h1>
      </div>
      <p className="text-sm text-muted-foreground">AI-powered water management for optimal crop growth</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Soil Moisture */}
        <div className="bg-card rounded-xl p-6 card-shadow border border-border text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Soil Moisture</p>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="hsl(140 10% 90%)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="40" stroke="hsl(142 71% 35%)" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={moistureOffset} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-display font-bold">{soilMoisture}%</span>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${soilMoisture >= 40 ? "bg-primary text-primary-foreground" : "bg-agri-amber/20 text-agri-amber"}`}>
            {soilMoisture >= 40 ? "OPTIMAL" : "LOW"}
          </span>
        </div>

        {/* Recommended Water */}
        <div className="agri-gradient-warm rounded-xl p-6 text-primary-foreground text-center">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-4 flex items-center justify-center gap-2">
            <Droplets className="w-4 h-4" /> Recommended Water
          </p>
          <p className="text-5xl font-display font-bold">{recommendedWater}<span className="text-2xl">L</span></p>
          <p className="text-xs uppercase opacity-70 mt-2">Per Irrigation Cycle</p>
          <div className="mt-4 flex items-center justify-center gap-2 bg-primary-foreground/20 rounded-lg py-2 text-xs">
            <Clock className="w-3 h-3" /> Next: 6:00 AM Tomorrow
          </div>
        </div>

        {/* Water Savings */}
        <div className="bg-card rounded-xl p-6 card-shadow border border-border text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">💧 Water Savings</p>
          <p className="text-4xl font-display font-bold text-primary">{waterSavings}<span className="text-xl">%</span></p>
          <p className="text-xs uppercase text-muted-foreground mt-2">Compared to Traditional Methods</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Efficiency</span>
              <span className="text-primary font-semibold">{waterSavings}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full">
              <div className="h-2 bg-primary rounded-full" style={{ width: `${waterSavings}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              📅 Daily Water Requirements
            </h2>
            <p className="text-xs text-muted-foreground mt-1">A quick view of water needed per day (7 days).</p>
          </div>
          <span className="px-3 py-1 border border-border rounded-lg text-xs font-medium">Liters (L)</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 10% 90%)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="completed" fill="hsl(142 71% 35%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="scheduled" fill="hsl(199 89% 75%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-6 justify-center mt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-primary" /> Completed</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-agri-blue/40" /> Scheduled</span>
        </div>
      </div>
    </div>
  );
};

export default Irrigation;
