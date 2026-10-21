import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MarketplaceStats from "@/components/marketplace/MarketplaceStats";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import CropCard, { type MarketCrop } from "@/components/marketplace/CropCard";
import OrderModal from "@/components/marketplace/OrderModal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 20;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const Marketplace = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [consumerLoc, setConsumerLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState("price_asc");
  const [page, setPage] = useState(1);

  // Modal
  const [modalItem, setModalItem] = useState<MarketCrop | null>(null);
  const [modalMode, setModalMode] = useState<"buy" | "bulk">("buy");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Get consumer location
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("latitude, longitude").eq("id", user.id).single().then(({ data }) => {
      if (data?.latitude && data?.longitude) setConsumerLoc({ lat: data.latitude, lng: data.longitude });
    });
  }, [user]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (items.length === 0) setLoading(true);
    try {
      const [profilesRes, detailsRes, cropsRes, ordersRes] = await Promise.all([
        supabase.rpc("get_public_farmer_profiles"),
        supabase.from("farmer_details").select("*"),
        supabase.from("crops").select("*"),
        supabase.from("orders").select("crop_name")
      ]);

      const profiles = Array.isArray(profilesRes.data) ? profilesRes.data : [];
      const details = Array.isArray(detailsRes.data) ? detailsRes.data : [];
      const dbCrops = Array.isArray(cropsRes.data) ? cropsRes.data : [];
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

      const detailsMap = new Map(details.map((d: any) => [d.user_id, d]));
      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

      const counts: Record<string, number> = {};
      orders.forEach((o: any) => { if (o.crop_name) counts[o.crop_name] = (counts[o.crop_name] || 0) + 1; });
      setOrderCounts(counts);

      let merged: MarketCrop[] = [];

      // 1. Map directly from crops collection in MongoDB
      if (dbCrops.length > 0) {
        merged = dbCrops.map((c: any) => {
          const farmer = profileMap.get(c.farmer_id);
          const farmerDetail = detailsMap.get(c.farmer_id);
          let distance_km: number | null = null;
          if (consumerLoc && farmerDetail?.latitude && farmerDetail?.longitude) {
            distance_km = haversine(consumerLoc.lat, consumerLoc.lng, farmerDetail.latitude, farmerDetail.longitude);
          }
          return {
            farmer_id: c.farmer_id || "farmer-demo-1",
            farmer_name: c.farmer_name || farmer?.full_name || "Organic Producer",
            region: c.location || farmer?.region || "Andhra Pradesh",
            crop_name: c.name || c.crop_type || "Organic Crop",
            total_yield: c.quantity || 1000,
            expected_price: c.price || 50,
            farming_type: farmerDetail?.farming_type || "Organic",
            latitude: farmerDetail?.latitude || 15.7747,
            longitude: farmerDetail?.longitude || 78.0557,
            demand_level: (counts[c.name] || 0) >= 3 ? "high" as const : "stable" as const,
            distance_km,
          };
        });
      }

      // 2. Fallback to synthesizing from farmer_details if crops collection was empty
      if (merged.length === 0 && profiles.length > 0) {
        merged = profiles
          .filter((p: any) => detailsMap.has(p.id))
          .map((p: any) => {
            const d = detailsMap.get(p.id) as any;
            const cropName = d.primary_crop || "Rice";
            return {
              farmer_id: p.id,
              farmer_name: p.full_name,
              region: p.region || "Andhra Pradesh",
              crop_name: cropName,
              total_yield: d.total_yield || 5000,
              expected_price: d.expected_price || 60,
              farming_type: d.farming_type || "Organic",
              latitude: d.latitude || 15.7747,
              longitude: d.longitude || 78.0557,
              demand_level: (counts[cropName] || 0) >= 3 ? "high" as const : "stable" as const,
              distance_km: null,
            };
          });
      }

      // 3. Fallback demo data if both were empty
      if (merged.length === 0) {
        merged = [
          {
            farmer_id: "farmer-demo-1",
            farmer_name: "Kurnool Organic Collective",
            region: "Andhra Pradesh",
            crop_name: "Organic Sona Masoori Rice",
            total_yield: 1200,
            expected_price: 55,
            farming_type: "Organic",
            latitude: 15.7747,
            longitude: 78.0557,
            demand_level: "high",
            distance_km: null
          },
          {
            farmer_id: "farmer-demo-1",
            farmer_name: "Rayalaseema Cotton Farmers",
            region: "Andhra Pradesh",
            crop_name: "Raw Organic Cotton Bales",
            total_yield: 800,
            expected_price: 120,
            farming_type: "Organic",
            latitude: 15.7747,
            longitude: 78.0557,
            demand_level: "stable",
            distance_km: null
          },
          {
            farmer_id: "farmer-demo-2",
            farmer_name: "Suresh Patel",
            region: "Maharashtra",
            crop_name: "Fresh Harvest Sharbati Wheat",
            total_yield: 2500,
            expected_price: 42,
            farming_type: "Conventional",
            latitude: 19.9975,
            longitude: 73.7898,
            demand_level: "high",
            distance_km: null
          }
        ];
      }

      setItems(merged);
      if (merged.length > 0) {
        const max = Math.max(...merged.map((i) => i.expected_price));
        setPriceRange([0, Math.max(max, 200)]);
      }
    } catch (err) {
      console.error("fetchData error in Marketplace:", err);
    } finally {
      setLoading(false);
    }
  }, [consumerLoc]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription for price changes & new crops
  useEffect(() => {
    const channel = supabase
      .channel("marketplace_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "crops" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "farmer_details" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Computed values
  const crops = useMemo(() => [...new Set(items.map((i) => i.crop_name))].sort(), [items]);
  const regions = useMemo(() => [...new Set(items.map((i) => i.region).filter(Boolean) as string[])].sort(), [items]);
  const farmingTypes = useMemo(() => [...new Set(items.map((i) => i.farming_type))].sort(), [items]);
  const maxPrice = useMemo(() => items.length ? Math.max(...items.map((i) => i.expected_price)) : 200, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      result = result.filter((i) =>
        i.crop_name.toLowerCase().includes(s) ||
        (i.region || "").toLowerCase().includes(s) ||
        i.farmer_name.toLowerCase().includes(s)
      );
    }
    if (cropFilter !== "all") result = result.filter((i) => i.crop_name === cropFilter);
    if (regionFilter !== "all") result = result.filter((i) => i.region === regionFilter);
    if (typeFilter !== "all") result = result.filter((i) => i.farming_type === typeFilter);
    result = result.filter((i) => i.expected_price >= priceRange[0] && i.expected_price <= priceRange[1]);

    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.expected_price - b.expected_price);
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => b.expected_price - a.expected_price);
    else if (sortBy === "yield_desc") result = [...result].sort((a, b) => b.total_yield - a.total_yield);
    else if (sortBy === "nearest") result = [...result].sort((a, b) => (a.distance_km ?? 99999) - (b.distance_km ?? 99999));

    return result;
  }, [items, debouncedSearch, cropFilter, regionFilter, typeFilter, priceRange, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    totalCrops: new Set(items.map((i) => i.crop_name)).size,
    avgPrice: items.length ? items.reduce((s, i) => s + i.expected_price, 0) / items.length : 0,
    activeFarmers: new Set(items.map((i) => i.farmer_id)).size,
    totalQuantity: items.reduce((s, i) => s + i.total_yield, 0),
  }), [items]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, cropFilter, regionFilter, typeFilter, priceRange, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-foreground">Marketplace</h1>

      <MarketplaceStats {...stats} loading={loading} />

      <MarketplaceFilters
        search={search} onSearch={setSearch}
        cropFilter={cropFilter} onCropFilter={setCropFilter}
        regionFilter={regionFilter} onRegionFilter={setRegionFilter}
        typeFilter={typeFilter} onTypeFilter={setTypeFilter}
        priceRange={priceRange} onPriceRange={setPriceRange} maxPrice={maxPrice}
        sortBy={sortBy} onSortBy={setSortBy}
        crops={crops} regions={regions} farmingTypes={farmingTypes}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading marketplace...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No crops currently available matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((item, idx) => (
              <CropCard
                key={`${item.farmer_id}-${idx}`}
                item={item}
                onBuyNow={(i) => { setModalItem(i); setModalMode("buy"); }}
                onBulkOrder={(i) => { setModalItem(i); setModalMode("bulk"); }}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <OrderModal
        item={modalItem}
        mode={modalMode}
        userId={user?.id}
        onClose={() => setModalItem(null)}
      />
    </div>
  );
};

export default Marketplace;
