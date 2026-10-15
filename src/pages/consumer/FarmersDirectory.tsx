import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Wheat, Ruler, Package, IndianRupee, Droplets } from "lucide-react";

interface FarmerWithDetails {
  id: string;
  full_name: string;
  region: string | null;
  primary_crop: string;
  land_area: number;
  total_yield: number;
  monthly_production: number;
  expected_price: number;
  farming_type: string;
  water_availability: string;
}

const FarmersDirectory = () => {
  const [farmers, setFarmers] = useState<FarmerWithDetails[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmers = async () => {
      const { data: profiles } = await supabase
        .rpc("get_public_farmer_profiles");

      if (!profiles?.length) { setLoading(false); return; }

      const { data: details } = await supabase.from("farmer_details")
        .select("*");

      const detailsMap = new Map((details || []).map((d: any) => [d.user_id, d]));

      const merged = profiles
        .filter((p) => detailsMap.has(p.id))
        .map((p) => {
          const d = detailsMap.get(p.id) as any;
          return {
            id: p.id,
            full_name: p.full_name,
            region: p.region,
            primary_crop: d.primary_crop as string,
            land_area: d.land_area as number,
            total_yield: d.total_yield as number,
            monthly_production: d.monthly_production as number,
            expected_price: d.expected_price as number,
            farming_type: d.farming_type as string,
            water_availability: d.water_availability as string,
          };
        });

      setFarmers(merged);
      setLoading(false);
    };
    fetchFarmers();
  }, []);

  const filtered = farmers.filter(
    (f) =>
      f.full_name.toLowerCase().includes(search.toLowerCase()) ||
      f.primary_crop.toLowerCase().includes(search.toLowerCase()) ||
      (f.region || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registered Farmers</h1>
        <p className="text-muted-foreground text-sm">Browse all farmers and their produce details</p>
      </div>
      <Input
        placeholder="Search by name, crop, or region..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      {loading ? (
        <p className="text-muted-foreground">Loading farmers...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No farmers found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{f.full_name}</CardTitle>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {f.region || "N/A"}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Wheat className="w-3.5 h-3.5" /> Primary Crop</span>
                  <Badge variant="secondary">{f.primary_crop}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Land Area</span>
                  <span>{f.land_area} acres</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Total Yield</span>
                  <span>{f.total_yield} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly Production</span>
                  <span>{f.monthly_production} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Price/kg</span>
                  <span>₹{f.expected_price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> Water</span>
                  <Badge variant="outline">{f.water_availability}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Farming Type</span>
                  <Badge>{f.farming_type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmersDirectory;
