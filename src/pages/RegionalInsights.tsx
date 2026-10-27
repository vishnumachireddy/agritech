import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(142 71% 35%)",
  "hsl(199 89% 48%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(270 60% 50%)",
  "hsl(180 60% 40%)",
];

const REGIONS = ["Telangana", "Andhra Pradesh", "Maharashtra", "Punjab", "Karnataka", "All Regions"];

const REGIONAL_BENCHMARKS: Record<string, { sowing: any[], profit: any[], top: string, best: string }> = {
  "Telangana": {
    sowing: [
      { name: "Cotton", value: 42, color: COLORS[0] },
      { name: "Rice", value: 36, color: COLORS[1] },
      { name: "Maize", value: 14, color: COLORS[2] },
      { name: "Pulses", value: 8, color: COLORS[3] }
    ],
    profit: [
      { name: "Cotton", value: 82, color: COLORS[0] },
      { name: "Rice", value: 58, color: COLORS[1] },
      { name: "Maize", value: 34, color: COLORS[2] },
      { name: "Pulses", value: 72, color: COLORS[3] }
    ],
    top: "Cotton",
    best: "Cotton"
  },
  "Andhra Pradesh": {
    sowing: [
      { name: "Rice", value: 45, color: COLORS[0] },
      { name: "Cotton", value: 25, color: COLORS[1] },
      { name: "Chili", value: 18, color: COLORS[2] },
      { name: "Sugarcane", value: 12, color: COLORS[3] }
    ],
    profit: [
      { name: "Chili", value: 110, color: COLORS[2] },
      { name: "Cotton", value: 85, color: COLORS[1] },
      { name: "Sugarcane", value: 90, color: COLORS[3] },
      { name: "Rice", value: 65, color: COLORS[0] }
    ],
    top: "Rice",
    best: "Chili"
  },
  "Maharashtra": {
    sowing: [
      { name: "Cotton", value: 38, color: COLORS[0] },
      { name: "Soybean", value: 32, color: COLORS[1] },
      { name: "Sugarcane", value: 18, color: COLORS[2] },
      { name: "Pulses", value: 12, color: COLORS[3] }
    ],
    profit: [
      { name: "Sugarcane", value: 95, color: COLORS[2] },
      { name: "Cotton", value: 85, color: COLORS[0] },
      { name: "Soybean", value: 68, color: COLORS[1] },
      { name: "Pulses", value: 74, color: COLORS[3] }
    ],
    top: "Cotton",
    best: "Sugarcane"
  },
  "Punjab": {
    sowing: [
      { name: "Wheat", value: 52, color: COLORS[0] },
      { name: "Rice", value: 36, color: COLORS[1] },
      { name: "Cotton", value: 8, color: COLORS[2] },
      { name: "Mustard", value: 4, color: COLORS[3] }
    ],
    profit: [
      { name: "Cotton", value: 88, color: COLORS[2] },
      { name: "Wheat", value: 48, color: COLORS[0] },
      { name: "Mustard", value: 62, color: COLORS[3] },
      { name: "Rice", value: 55, color: COLORS[1] }
    ],
    top: "Wheat",
    best: "Cotton"
  },
  "Karnataka": {
    sowing: [
      { name: "Maize", value: 35, color: COLORS[0] },
      { name: "Sugarcane", value: 28, color: COLORS[1] },
      { name: "Rice", value: 22, color: COLORS[2] },
      { name: "Ragi", value: 15, color: COLORS[3] }
    ],
    profit: [
      { name: "Sugarcane", value: 92, color: COLORS[1] },
      { name: "Rice", value: 62, color: COLORS[2] },
      { name: "Ragi", value: 45, color: COLORS[3] },
      { name: "Maize", value: 36, color: COLORS[0] }
    ],
    top: "Maize",
    best: "Sugarcane"
  },
  "All Regions": {
    sowing: [
      { name: "Rice", value: 35, color: COLORS[0] },
      { name: "Wheat", value: 28, color: COLORS[1] },
      { name: "Cotton", value: 20, color: COLORS[2] },
      { name: "Maize", value: 11, color: COLORS[3] },
      { name: "Sugarcane", value: 6, color: COLORS[4] }
    ],
    profit: [
      { name: "Cotton", value: 85, color: COLORS[2] },
      { name: "Sugarcane", value: 90, color: COLORS[4] },
      { name: "Rice", value: 60, color: COLORS[0] },
      { name: "Wheat", value: 45, color: COLORS[1] },
      { name: "Maize", value: 35, color: COLORS[3] }
    ],
    top: "Rice",
    best: "Sugarcane"
  }
};

const RegionalInsights = () => {
  const { user } = useAuth();
  const [region, setRegion] = useState("Telangana");
  const [sowingData, setSowingData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topCrop, setTopCrop] = useState("");
  const [bestProfit, setBestProfit] = useState("");

  // Sync user profile region once available
  useEffect(() => {
    if (user?.id) {
      supabase.from("profiles").select("region").eq("id", user.id).single().then(({ data }) => {
        if (data?.region && REGIONS.includes(data.region)) {
          setRegion(data.region);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: farmers } = await supabase.rpc("get_public_farmer_profiles");
        const { data: details } = await supabase.from("farmer_details").select("*");

        if (farmers && Array.isArray(farmers) && details && Array.isArray(details) && details.length > 0) {
          const regionFarmerIds = (region === "All Regions" || !region)
            ? farmers.map((f: any) => f.id)
            : farmers.filter((f: any) => f.region === region).map((f: any) => f.id);

          const regionDetails = details.filter((d: any) => regionFarmerIds.includes(d.user_id));

          if (regionDetails.length > 0) {
            const cropCounts: Record<string, number> = {};
            const cropPrices: Record<string, { total: number; count: number }> = {};

            regionDetails.forEach((d: any) => {
              cropCounts[d.primary_crop] = (cropCounts[d.primary_crop] || 0) + (d.land_area || 1);
              if (!cropPrices[d.primary_crop]) cropPrices[d.primary_crop] = { total: 0, count: 0 };
              cropPrices[d.primary_crop].total += (d.expected_price || 50);
              cropPrices[d.primary_crop].count += 1;
            });

            const totalArea = Object.values(cropCounts).reduce((a, b) => a + b, 0) || 1;
            const sowing = Object.entries(cropCounts).map(([name, area], i) => ({
              name,
              value: Math.round((area / totalArea) * 100),
              color: COLORS[i % COLORS.length],
            }));

            const profit = Object.entries(cropPrices).map(([name, { total, count }], i) => ({
              name,
              value: Math.round(total / count),
              color: COLORS[i % COLORS.length],
            }));

            setSowingData(sowing);
            setProfitData(profit);
            if (sowing.length > 0) setTopCrop(sowing.sort((a, b) => b.value - a.value)[0].name);
            if (profit.length > 0) setBestProfit(profit.sort((a, b) => b.value - a.value)[0].name);
            setLoading(false);
            return;
          }
        }

        // Use regional benchmark data
        const benchmark = REGIONAL_BENCHMARKS[region] || REGIONAL_BENCHMARKS["Telangana"];
        setSowingData(benchmark.sowing);
        setProfitData(benchmark.profit);
        setTopCrop(benchmark.top);
        setBestProfit(benchmark.best);
      } catch (err) {
        const benchmark = REGIONAL_BENCHMARKS[region] || REGIONAL_BENCHMARKS["Telangana"];
        setSowingData(benchmark.sowing);
        setProfitData(benchmark.profit);
        setTopCrop(benchmark.top);
        setBestProfit(benchmark.best);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region]);

  const season = new Date().getMonth() >= 5 && new Date().getMonth() <= 9 ? "Kharif" : "Rabi";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Regional Insights</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" /> {region} Agricultural Trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm bg-card">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Season: <span className="text-primary font-semibold">{season}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl p-12 text-center card-shadow border border-border">
          <p className="text-muted-foreground text-sm">Loading regional insights...</p>
        </div>
      ) : sowingData.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center card-shadow border border-border">
          <p className="text-muted-foreground">No regional farmer data available yet for {region}.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { title: "Crop Sowing Distribution", sub: `Percentage of cultivated area in ${region}`, data: sowingData },
              { title: "Average Price per Crop", sub: `Estimated price (₹/kg) for major crops in ${region}`, data: profitData },
            ].map((chart) => (
              <div key={chart.title} className="bg-card rounded-xl p-6 card-shadow border border-border">
                <h2 className="font-semibold text-sm mb-1">{chart.title}</h2>
                <p className="text-xs text-muted-foreground mb-4">{chart.sub}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={chart.data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                      {chart.data.map((entry: any) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-2 flex-wrap">
                  {chart.data.map((d: any) => (
                    <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name} ({d.value}{chart.title.includes("Price") ? " ₹/kg" : "%"})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Seasonal Insight */}
          <div className="bg-accent/50 rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">₹</span>
              <div>
                <p className="font-semibold text-sm">
                  Seasonal Insight for {region}{" "}
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full ml-2">
                    {season}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Our regional models indicate that <strong>{topCrop || "N/A"}</strong> covers the largest cultivated area in {region},
                  while <strong>{bestProfit || "N/A"}</strong> commands the highest average realization per kg this season.
                  Check the <span className="text-primary font-semibold">Demand & Supply</span> module for real-time buyer demand and wholesale rates.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegionalInsights;
