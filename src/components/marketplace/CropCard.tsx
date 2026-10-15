import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, IndianRupee, Package, Wheat, ShoppingCart, Flame, TrendingDown } from "lucide-react";

export interface MarketCrop {
  farmer_id: string;
  farmer_name: string;
  region: string | null;
  crop_name: string;
  total_yield: number;
  expected_price: number;
  farming_type: string;
  latitude: number | null;
  longitude: number | null;
  demand_level: "high" | "stable";
  distance_km: number | null;
}

interface CropCardProps {
  item: MarketCrop;
  onBuyNow: (item: MarketCrop) => void;
  onBulkOrder: (item: MarketCrop) => void;
}

const CropCard = ({ item, onBuyNow, onBulkOrder }: CropCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Wheat className="w-4 h-4 text-primary" /> {item.crop_name}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{item.farming_type}</Badge>
          {item.demand_level === "high" ? (
            <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30 text-[10px] gap-0.5">
              <Flame className="w-3 h-3" /> High Demand
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-0.5">
              <TrendingDown className="w-3 h-3" /> Stable
            </Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{item.farmer_name}</p>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> Region</span>
        <span>{item.region || "N/A"}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-muted-foreground"><Package className="w-3.5 h-3.5" /> Available</span>
        <span>{item.total_yield} kg</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-muted-foreground"><IndianRupee className="w-3.5 h-3.5" /> Price/kg</span>
        <span className="font-semibold text-foreground">₹{item.expected_price}</span>
      </div>
      {item.distance_km !== null && (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> Distance</span>
          <span>{item.distance_km.toFixed(1)} km away</span>
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <Button size="sm" className="flex-1" onClick={() => onBuyNow(item)}>
          <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Buy Now
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onBulkOrder(item)}>
          Bulk Order
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default CropCard;
