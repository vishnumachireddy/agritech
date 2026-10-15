import { Card, CardContent } from "@/components/ui/card";
import { Wheat, IndianRupee, Users, Package } from "lucide-react";

interface StatsProps {
  totalCrops: number;
  avgPrice: number;
  activeFarmers: number;
  totalQuantity: number;
  loading: boolean;
}

const StatCard = ({ icon: Icon, label, value, loading }: { icon: any; label: string; value: string; loading: boolean }) => (
  <Card>
    <CardContent className="flex items-center gap-3 py-4">
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">
          {loading ? "..." : value}
        </p>
      </div>
    </CardContent>
  </Card>
);

const MarketplaceStats = ({ totalCrops, avgPrice, activeFarmers, totalQuantity, loading }: StatsProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <StatCard icon={Wheat} label="Available Crops" value={String(totalCrops)} loading={loading} />
    <StatCard icon={IndianRupee} label="Avg Price / kg" value={`₹${avgPrice.toFixed(0)}`} loading={loading} />
    <StatCard icon={Users} label="Active Farmers" value={String(activeFarmers)} loading={loading} />
    <StatCard icon={Package} label="Total Quantity" value={`${totalQuantity.toLocaleString()} kg`} loading={loading} />
  </div>
);

export default MarketplaceStats;
