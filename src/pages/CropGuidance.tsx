import { useState } from "react";
import { BookOpen, Sprout, TestTube, Coins, TrendingUp, MessageSquare, Loader2, Send, Lightbulb, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { locationData } from "@/data/locationData";
import { API_BASE as GLOBAL_API_BASE } from "@/config";
import { useLanguage } from "@/hooks/useLanguage";

const API_BASE = `${GLOBAL_API_BASE}/crop-guidance`;

const soilOptions = [
  { label: "Loamy", value: "Loamy" }, { label: "Clay", value: "Clay" }, { label: "Sandy", value: "Sandy" },
  { label: "Alluvial", value: "Alluvial" }, { label: "Black Soil", value: "Black" }, { label: "Red Soil", value: "Red" }, { label: "Laterite", value: "Laterite" }
];
const seasonOptions = [
  { label: "Kharif", value: "Kharif" }, { label: "Rabi", value: "Rabi" }, { label: "Zaid", value: "Zaid" }
];
const nitrogenOptions = [
  { label: "0-25 (Low)", value: 12.5 }, { label: "25-50 (Medium)", value: 37.5 }, { label: "50-75 (High)", value: 62.5 }, { label: "75+ (Very High)", value: 87.5 }
];
const tempOptions = [
  { label: "15-20 °C", value: 17.5 }, { label: "20-25 °C", value: 22.5 }, { label: "25-30 °C", value: 27.5 }, { label: "30-35 °C", value: 32.5 }
];
const humidityOptions = [
  { label: "40-50 %", value: 45 }, { label: "50-60 %", value: 55 }, { label: "60-70 %", value: 65 }, { label: "70-80 %", value: 75 }
];
const rainfallOptions = [
  { label: "50-100 mm", value: 75 }, { label: "100-150 mm", value: 125 }, { label: "150-200 mm", value: 175 }, { label: "200+ mm", value: 225 }
];
const phOptions = [
  { label: "5.5 - 6.0", value: 5.75 }, { label: "6.0 - 6.5", value: 6.25 }, { label: "6.5 - 7.0", value: 6.75 }, { label: "7.0 - 7.5", value: 7.25 }, { label: "7.5 - 8.0", value: 7.75 }
];

// Helper functions for dynamic hierarchical location data
const statesList = Object.keys(locationData).map(s => ({ label: s, value: s }));
const getDistricts = (state: string) => locationData[state] ? Object.keys(locationData[state]).map(d => ({ label: d, value: d })) : [];
const getMandals = (state: string, district: string) => locationData[state]?.[district] ? locationData[state][district].map(m => ({ label: m, value: m })) : [];

const SmartInput = ({ label, value, onChange, options, type = "text", placeholder = "Enter value..." }: { label: string, value: any, onChange: (val: any) => void, options: { label: string, value: any }[], type?: string, placeholder?: string }) => {
  const [isManual, setIsManual] = useState(false);

  const isValueInOptions = value !== "" && options.some(o => String(o.value).toLowerCase() === String(value).toLowerCase());
  const showWarning = isManual && value !== "" && type === "text" && !isValueInOptions;

  return (
    <div className="space-y-1.5 p-3 border border-border/60 rounded-xl bg-card card-shadow transition-all group hover:border-primary/30">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-foreground text-sm">{label}</Label>
        <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
          <Label className="text-[10px] text-muted-foreground uppercase cursor-pointer" onClick={() => setIsManual(!isManual)}>Manual Entry</Label>
          <Switch checked={isManual} onCheckedChange={setIsManual} className="scale-75 origin-right m-0" />
        </div>
      </div>
      <div className="pt-1">
        {isManual ? (
          <Input
            type={type}
            step={type === "number" ? "any" : undefined}
            value={value === "" ? "" : value}
            onChange={e => {
              const str = e.target.value;
              if (str === "") { onChange(""); return; }
              const val = type === "number" ? parseFloat(str) : str;
              onChange(val);
            }}
            placeholder={placeholder}
            className="bg-background w-full h-9 text-sm focus-visible:ring-primary"
          />
        ) : (
          <select
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            value={value}
            onChange={e => {
              const val = type === "number" ? parseFloat(e.target.value) : e.target.value;
              onChange(val);
            }}
          >
            <option value="" disabled>Select from list</option>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>
      <div className="min-h-[16px]">
        {showWarning ? (
          <p className="text-[10px] text-agri-amber font-semibold mt-1 flex items-center gap-1 animate-fade-in"><AlertTriangle className="w-3 h-3" /> Warning: Unofficial value</p>
        ) : (
          <p className="text-[10px] text-muted-foreground italic mt-1 opacity-70 group-hover:opacity-100 transition-opacity">Select from list or enter custom value</p>
        )}
      </div>
    </div>
  );
};

const CropGuidance = () => {
  const [activeTab, setActiveTab] = useState("recommendation");

  const tabs = [
    { id: "recommendation", label: "Crop Recommendation", icon: Sprout },
    { id: "soil", label: "Soil Analysis", icon: TestTube },
    { id: "profit", label: "Profit Estimation", icon: Coins },
    { id: "market", label: "Market Strategy", icon: TrendingUp },
    { id: "chat", label: "AI Advisory Chat", icon: MessageSquare },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-primary text-xs font-semibold rounded-full mb-3">
          <BookOpen className="w-3 h-3" /> Independent AI Engine
        </span>
        <h1 className="text-2xl font-display font-bold text-agri-orange">Crop Guidance AI Module</h1>
        <p className="text-sm text-muted-foreground mt-1">Science-backed machine learning strategies</p>
      </div>

      <div className="flex border-b border-border overflow-x-auto justify-start md:justify-center scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        {activeTab === "recommendation" && <TabRecommendation />}
        {activeTab === "soil" && <TabSoilAnalysis />}
        {activeTab === "profit" && <TabProfitEstimation />}
        {activeTab === "market" && <TabMarketStrategy />}
        {activeTab === "chat" && <TabChat />}
      </div>
    </div>
  );
};

export default CropGuidance;

// 1) Crop Recommendation Tab
const TabRecommendation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    state: "Andhra Pradesh", district: "Kurnool", mandal: "Adoni",
    soil_type: "Loamy", season: "Kharif", ph: 6.25,
    nitrogen: 37.5, phosphorus: 37.5, potassium: 37.5,
    temperature: 27.5, humidity: 65, rainfall: 125
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors = [];
    if (isNaN(Number(form.ph))) errors.push("pH");
    if (isNaN(Number(form.nitrogen))) errors.push("Nitrogen");
    if (isNaN(Number(form.phosphorus))) errors.push("Phosphorus");
    if (isNaN(Number(form.potassium))) errors.push("Potassium");
    if (isNaN(Number(form.temperature))) errors.push("Temperature");
    if (isNaN(Number(form.humidity))) errors.push("Humidity");
    if (isNaN(Number(form.rainfall))) errors.push("Rainfall");

    if (errors.length > 0) {
      toast.error(`Invalid numbers in: ${errors.join(", ")}`);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const payload = {
        ...form,
        ph: Number(form.ph),
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        temperature: Number(form.temperature),
        humidity: Number(form.humidity),
        rainfall: Number(form.rainfall)
      };

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setResult(data);
      toast.success("Recommendation generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to Machine Learning Service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-shadow border-border overflow-visible">
      <CardHeader className="bg-muted/10 border-b pb-6">
        <CardTitle>Crop Recommendation</CardTitle>
        <CardDescription>Get an AI prediction for the best crop based on exact lab data or estimated parameters</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2"><TrendingUp className="w-4 h-4" /> Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SmartInput label="State" value={form.state} onChange={v => setForm({ ...form, state: v, district: "", mandal: "" })} options={statesList} placeholder="E.g. Andhra Pradesh" />
              <SmartInput label="District" value={form.district} onChange={v => setForm({ ...form, district: v, mandal: "" })} options={getDistricts(form.state)} placeholder="E.g. Kurnool" />
              <SmartInput label="Mandal" value={form.mandal} onChange={v => setForm({ ...form, mandal: v })} options={getMandals(form.state, form.district)} placeholder="E.g. Adoni" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2"><TestTube className="w-4 h-4" /> Soil & NPK Nutrition</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SmartInput label="Soil Type" value={form.soil_type} onChange={v => setForm({ ...form, soil_type: v })} options={soilOptions} placeholder="E.g. Black Soil" />
              <SmartInput label="pH Level" value={form.ph} onChange={v => setForm({ ...form, ph: v })} options={phOptions} type="number" placeholder="E.g. 6.5" />
              <SmartInput label="Nitrogen (N)" value={form.nitrogen} onChange={v => setForm({ ...form, nitrogen: v })} options={nitrogenOptions} type="number" placeholder="E.g. 45" />
              <SmartInput label="Phosphorus (P)" value={form.phosphorus} onChange={v => setForm({ ...form, phosphorus: v })} options={nitrogenOptions} type="number" placeholder="E.g. 20" />
              <SmartInput label="Potassium (K)" value={form.potassium} onChange={v => setForm({ ...form, potassium: v })} options={nitrogenOptions} type="number" placeholder="E.g. 30" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-agri-orange flex items-center gap-2 border-b pb-2"><Sprout className="w-4 h-4" /> Weather & Climate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SmartInput label="Season" value={form.season} onChange={v => setForm({ ...form, season: v })} options={seasonOptions} placeholder="E.g. Kharif" />
              <SmartInput label="Temperature (°C)" value={form.temperature} onChange={v => setForm({ ...form, temperature: v })} options={tempOptions} type="number" placeholder="E.g. 28.5" />
              <SmartInput label="Humidity (%)" value={form.humidity} onChange={v => setForm({ ...form, humidity: v })} options={humidityOptions} type="number" placeholder="E.g. 60" />
              <SmartInput label="Rainfall (mm)" value={form.rainfall} onChange={v => setForm({ ...form, rainfall: v })} options={rainfallOptions} type="number" placeholder="E.g. 150" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-md font-semibold mt-4">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Run Machine Learning Model"}
          </Button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sprout className="w-32 h-32 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
              <CheckCircle className="text-primary w-6 h-6" /> Recommended: {result.recommended_crop}
            </h3>
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
              AI Confidence Score: {(result.confidence_score * 100).toFixed(1)}%
            </p>
            <div className="pt-4 mt-4 border-t border-primary/20">
              {result.ai_explanation && result.ai_explanation.includes("AI explanation temporarily unavailable") ? (
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md flex items-start gap-2 border border-yellow-300 dark:border-yellow-700/50">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">AI Notice</p>
                    <p className="text-sm mt-1">{result.ai_explanation}</p>
                    <Button variant="outline" size="sm" className="mt-3 h-8 text-xs bg-card" onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }}>Retry AI Explanation</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{result.ai_explanation}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 2) Soil Analysis Tab
const TabSoilAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    state: "Andhra Pradesh", district: "Kurnool", mandal: "Adoni",
    soil_type: "Black", rainfall: 125
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(Number(form.rainfall))) {
      toast.error("Rainfall must be a valid number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/soil-analysis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, region: `${form.district}, ${form.state}`, rainfall: Number(form.rainfall) })
      });
      if (!res.ok) throw new Error("API request failed");
      setResult(await res.json());
      toast.success("Analysis complete");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-shadow border-border">
      <CardHeader>
        <CardTitle>Soil Analysis</CardTitle>
        <CardDescription>Predict missing soil nutritional facts and fertilizer need</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SmartInput label="State" value={form.state} onChange={v => setForm({ ...form, state: v, district: "", mandal: "" })} options={statesList} placeholder="E.g. Andhra Pradesh" />
            <SmartInput label="District" value={form.district} onChange={v => setForm({ ...form, district: v, mandal: "" })} options={getDistricts(form.state)} placeholder="E.g. Kurnool" />
            <SmartInput label="Soil Type" value={form.soil_type} onChange={v => setForm({ ...form, soil_type: v })} options={soilOptions} placeholder="E.g. Black Soil" />
            <SmartInput label="Rainfall (mm)" value={form.rainfall} onChange={v => setForm({ ...form, rainfall: v })} options={rainfallOptions} type="number" placeholder="E.g. 150" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Soil"}</Button>
        </form>

        {result && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/60 rounded-xl text-center border border-border"><p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Est. Nitrogen</p><p className="font-bold text-lg text-primary">{result.predicted_nitrogen}</p></div>
            <div className="p-4 bg-muted/60 rounded-xl text-center border border-border"><p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Est. Phosphorus</p><p className="font-bold text-lg text-primary">{result.predicted_phosphorus}</p></div>
            <div className="p-4 bg-muted/60 rounded-xl text-center border border-border"><p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Est. Potassium</p><p className="font-bold text-lg text-primary">{result.predicted_potassium}</p></div>
            <div className="p-4 bg-muted/60 rounded-xl text-center border border-border"><p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Est. pH</p><p className="font-bold text-lg text-agri-orange">{result.predicted_ph}</p></div>
            <div className="col-span-full p-5 mt-2 border border-primary/20 bg-primary/5 rounded-xl">
              <p className="text-sm font-bold mb-2 flex items-center gap-2"><TestTube className="w-4 h-4 text-primary" /> Fertilizer Recommendation</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.fertilizer_recommendation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 3) Profit Estimation Tab
const TabProfitEstimation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({ crop_name: "Cotton", land_size: 2.5 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profit-estimation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("API request failed");
      setResult(await res.json());
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <Card className="card-shadow border-border">
      <CardHeader><CardTitle>Profit Estimation</CardTitle><CardDescription>Calculate expected harvest margins instantly</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-sm font-semibold">Crop Name</Label><Input value={form.crop_name} onChange={e => setForm({ ...form, crop_name: e.target.value })} className="h-10" /></div>
            <div className="space-y-1.5"><Label className="text-sm font-semibold">Land Size (Acres)</Label><Input type="number" step="0.1" value={form.land_size} onChange={e => setForm({ ...form, land_size: parseFloat(e.target.value) })} className="h-10" /></div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Calculate Profit"}</Button>
        </form>

        {result && (
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 bg-muted/30 rounded-xl text-center border-2 border-transparent"><p className="text-xs text-muted-foreground uppercase font-semibold">Est. Revenue</p><p className="font-bold text-xl mt-1 text-primary">₹{(result.expected_revenue).toLocaleString()}</p></div>
              <div className="p-5 bg-muted/30 rounded-xl text-center border-2 border-transparent"><p className="text-xs text-muted-foreground uppercase font-semibold">Est. Cost</p><p className="font-bold text-xl mt-1 text-agri-red">₹{(result.estimated_cost).toLocaleString()}</p></div>
              <div className="p-5 bg-primary/5 rounded-xl text-center border-2 border-primary/20"><p className="text-xs text-primary uppercase font-bold">Net Profit</p><p className="font-bold text-2xl mt-1 text-foreground">₹{(result.net_profit).toLocaleString()}</p></div>
            </div>
            <div className="p-4 bg-accent/30 rounded-xl flex items-start gap-3 mt-4 border border-border">
              <Lightbulb className="w-5 h-5 text-agri-orange shrink-0 mt-0.5" />
              <p className="font-medium text-sm leading-relaxed"><span className="text-foreground font-bold mr-1">AI Tip:</span> <span className="text-muted-foreground">{result.strategic_tip}</span></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 4) Market Strategy Tab
const TabMarketStrategy = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({ crop_name: "Cotton", current_price: 65, storage_capacity_months: 3 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/market-strategy`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("API request failed");
      setResult(await res.json());
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <Card className="card-shadow border-border">
      <CardHeader><CardTitle>Market Strategy</CardTitle><CardDescription>Determine whether to sell now or store for later</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-sm font-semibold">Crop Name</Label><Input value={form.crop_name} onChange={e => setForm({ ...form, crop_name: e.target.value })} className="h-10" /></div>
            <div className="space-y-1.5"><Label className="text-sm font-semibold">Current Price (/kg)</Label><Input type="number" value={form.current_price} onChange={e => setForm({ ...form, current_price: parseFloat(e.target.value) })} className="h-10" /></div>
            <div className="space-y-1.5"><Label className="text-sm font-semibold">Storage Capacity (Months)</Label><Input type="number" value={form.storage_capacity_months} onChange={e => setForm({ ...form, storage_capacity_months: parseInt(e.target.value) })} className="h-10" /></div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Strategy"}</Button>
        </form>

        {result && (
          <div className="mt-8 border border-border/60 rounded-xl overflow-hidden text-sm bg-card shadow-sm">
            <div className="p-5 flex items-center justify-between border-b border-border/60 bg-muted/40">
              <span className="text-muted-foreground uppercase font-bold text-xs tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Strategy Recommendation</span>
              <span className={`px-4 py-1.5 text-xs font-bold uppercase rounded-full tracking-wider ${result.recommendation === 'store' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-agri-amber/20 text-agri-amber border border-agri-amber/30'}`}>
                {result.recommendation.replace('_', ' ')}
              </span>
            </div>
            <div className="p-6 space-y-4 bg-card">
              <div className="flex flex-col gap-1 border-b border-border/50 pb-4">
                <p className="flex justify-between items-center"><strong className="text-muted-foreground font-medium uppercase text-xs">Future Price Pred:</strong> <span className="font-bold text-lg">₹{result.future_price_prediction.toFixed(2)} /kg</span></p>
                <p className="flex justify-between items-center"><strong className="text-muted-foreground font-medium uppercase text-xs">Wait Duration:</strong> <span className="font-bold">{result.months_recommended} months</span></p>
              </div>
              <p className="text-muted-foreground italic leading-relaxed pt-2 flex items-start gap-3">
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                {result.reasoning}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 5) AI Advisory Chat Tab
const TabChat = () => {
  const { isTelugu } = useLanguage();
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { 
      role: 'bot', 
      text: isTelugu 
        ? 'నమస్కారం! నేను పంటల సలహా AI సహాయకుడిని. మీ వ్యవసాయ సందేహాలు లేదా పంట సమస్యలను అడగండి.'
        : 'Hello! I am the isolated Crop Guidance LLM. How can I help with your agriculture needs?' 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const outgoingMsg = isTelugu 
      ? `${userMsg} (దయచేసి రైతులకు సులభంగా అర్థమయ్యే విధంగా సరళమైన తెలుగులో సమాధానం ఇవ్వండి)`
      : userMsg;

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: outgoingMsg })
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (err: any) {
      toast.error(err.message);
      setMessages(prev => [...prev, { role: 'bot', text: isTelugu ? "సర్వర్ కనెక్ట్ చేయడంలో సమస్య ఏర్పడింది." : "Error connecting to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-shadow border-border h-[600px] flex flex-col">
      <CardHeader className="py-4 border-b bg-muted/10">
        <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> AI Advisory Chat</CardTitle>
        <CardDescription>Direct interactive console utilizing independent ML algorithms</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-dot-pattern">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div></div>}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3 bg-card shadow-sm z-10">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-muted/30 focus-visible:ring-primary h-11" />
          <Button type="submit" disabled={loading} size="icon" className="h-11 w-11 shrink-0"><Send className="w-5 h-5" /></Button>
        </form>
      </CardContent>
    </Card>
  );
};
