import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";

interface FiltersProps {
  search: string;
  onSearch: (v: string) => void;
  cropFilter: string;
  onCropFilter: (v: string) => void;
  regionFilter: string;
  onRegionFilter: (v: string) => void;
  typeFilter: string;
  onTypeFilter: (v: string) => void;
  priceRange: [number, number];
  onPriceRange: (v: [number, number]) => void;
  maxPrice: number;
  sortBy: string;
  onSortBy: (v: string) => void;
  crops: string[];
  regions: string[];
  farmingTypes: string[];
}

const MarketplaceFilters = ({
  search, onSearch,
  cropFilter, onCropFilter,
  regionFilter, onRegionFilter,
  typeFilter, onTypeFilter,
  priceRange, onPriceRange, maxPrice,
  sortBy, onSortBy,
  crops, regions, farmingTypes,
}: FiltersProps) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search crop, region, farmer..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Select value={cropFilter} onValueChange={onCropFilter}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Crop" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Crops</SelectItem>
          {crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={regionFilter} onValueChange={onRegionFilter}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Region" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeFilter}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Farming Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {farmingTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={onSortBy}>
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="price_asc">Price: Low → High</SelectItem>
          <SelectItem value="price_desc">Price: High → Low</SelectItem>
          <SelectItem value="yield_desc">Yield: High → Low</SelectItem>
          <SelectItem value="nearest">Nearest First</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {maxPrice > 0 && (
      <div className="flex items-center gap-4 max-w-md">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Price Range</Label>
        <Slider
          min={0}
          max={maxPrice}
          step={1}
          value={[priceRange[0], priceRange[1]]}
          onValueChange={(v) => onPriceRange([v[0], v[1]])}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          ₹{priceRange[0]} – ₹{priceRange[1]}
        </span>
      </div>
    )}
  </div>
);

export default MarketplaceFilters;
