import React, { useState, useEffect } from "react";
import {
    Calendar,
    MapPin,
    Sprout,
    ChevronRight,
    AlertCircle,
    Clock,
    Droplets,
    FlaskConical,
    ShieldCheck,
    Wheat,
    Zap,
    TrendingUp,
    Wind,
    Sun,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface TimelineStage {
    id: number;
    title: string;
    durationDays: number;
    icon: React.ElementType;
    actions: string[];
    fertilizer: string;
    irrigation: string;
    risks: string[];
}

const CROPS = [
    { id: "tomato", name: "Tomato (Hybrid)", region: "Southern Plateau" },
    { id: "rice", name: "Rice (Short Grain)", region: "Coastal Delta" },
    { id: "cotton", name: "Cotton (Bt)", region: "Semi-Arid Central" },
    { id: "wheat", name: "Wheat (Winter)", region: "Northern Plains" }
];

const STAGES_TEMPLATE: TimelineStage[] = [
    {
        id: 1,
        title: "Seed Sowing",
        durationDays: 5,
        icon: Sprout,
        actions: ["Soil preparation", "Seed treatment", "Depth check"],
        fertilizer: "Basal application of NPK (12:32:16)",
        irrigation: "Light pre-sowing irrigation",
        risks: ["Soil-borne pests", "Early moisture stress"]
    },
    {
        id: 2,
        title: "Germination",
        durationDays: 10,
        icon: Zap,
        actions: ["Emergence monitoring", "Soil crust breaking"],
        fertilizer: "No top-dress required",
        irrigation: "Frequent misting / light watering",
        risks: ["Seed rotting", "Poor germination percentage"]
    },
    {
        id: 3,
        title: "Vegetative Growth",
        durationDays: 25,
        icon: Activity,
        actions: ["Weeding", "Inter-cultivation", "Thinning"],
        fertilizer: "Urea top-dressing (45 days post-sowing)",
        irrigation: "Alternate day furrow irrigation",
        risks: ["Aphid attack", "Nutrient deficiency symptoms"]
    },
    {
        id: 4,
        title: "Flowering Stage",
        durationDays: 20,
        icon: Sun,
        actions: ["Nipping", "Pest scouting", "Flower retention"],
        fertilizer: "MOP (Muriate of Potash) application",
        irrigation: "Maintain consistent soil moisture",
        risks: ["Heat wave stress", "Bollworm / Early larvae"]
    },
    {
        id: 5,
        title: "Fruit Development",
        durationDays: 30,
        icon: Droplets,
        actions: ["Support / Staking", "Nutrient spraying"],
        fertilizer: "Boron & Calcium foliar spray",
        irrigation: "Critical irrigation needed",
        risks: ["Fruit cracking", "Fungal infections"]
    },
    {
        id: 6,
        title: "Harvest",
        durationDays: 10,
        icon: Wheat,
        actions: ["Quality grading", "Sorting", "Post-harvest storage"],
        fertilizer: "Withdrawal (Stop 15 days prior)",
        irrigation: "Reduce irrigation gradually",
        risks: ["Excess rainfall", "Weight loss during transit"]
    }
];

const AgriChrono = () => {
    const [selectedCrop, setSelectedCrop] = useState(CROPS[0].id);
    const [sowingDate, setSowingDate] = useState(new Date().toISOString().split('T')[0]);
    const [region, setRegion] = useState(CROPS[0].region);
    const [isActive, setIsActive] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);

    const handleStart = () => {
        setIsActive(true);
        toast.success("AI Lifecycle Engine Initialized!");
        // Simulate real-time progress for demo
        setCurrentProgress(35);
    };

    const calculateDate = (daysFromStart: number) => {
        const date = new Date(sowingDate);
        date.setDate(date.getDate() + daysFromStart);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#050B05] text-white p-6 pb-20 font-sans overflow-x-hidden relative">
            {/* Futuristic Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-agri-green/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-agri-amber/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-10 animate-in fade-in slide-in-from-top duration-700">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-agri-green/20 rounded-2xl border border-agri-green/30">
                            <Clock className="w-8 h-8 text-agri-green animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-agri-green/50 bg-clip-text text-transparent">
                                AgriChrono™
                            </h1>
                            <p className="text-agri-green font-mono text-sm tracking-widest uppercase">Precision Crop Lifecycle Intelligence</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground ml-[72px]">From seed to harvest, powered by predictive AI timing</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT PANEL: INPUTS */}
                    <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-left duration-700">
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-agri-green/5 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-white">
                                    <Activity className="w-5 h-5 text-agri-green" /> Configuration
                                </CardTitle>
                                <CardDescription className="text-white/60">Initialize your farming mission parameters</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-agri-green/80 uppercase tracking-widest">Select Crop</label>
                                    <select
                                        value={selectedCrop}
                                        onChange={(e) => setSelectedCrop(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-agri-green/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {CROPS.map(c => <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-agri-green/80 uppercase tracking-widest">Sowing Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={sowingDate}
                                            onChange={(e) => setSowingDate(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-agri-green/50 transition-all"
                                        />
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-agri-green pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-agri-green/80 uppercase tracking-widest">Region</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={region}
                                            onChange={(e) => setRegion(e.target.value)}
                                            placeholder="Enter region..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-agri-green/50 transition-all"
                                        />
                                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-agri-green" />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleStart}
                                    className="w-full bg-agri-green hover:bg-agri-green/90 text-black font-bold h-14 rounded-xl shadow-lg shadow-agri-green/20 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    <Zap className="w-5 h-5 mr-2" />
                                    START LIFECYCLE COMMANDER
                                </Button>
                            </CardContent>
                        </Card>

                        {/* ALERT PREVIEW PANEL */}
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                            <CardHeader className="pb-3 text-white">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-agri-amber" /> Upcoming Critical Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { text: "Fertilizer Application due in 2 days", type: "warning", time: "Day 43" },
                                    { text: "Preventive spray recommended in 5 days", type: "info", time: "Day 46" },
                                    { text: "High heat (42°C) expected next week", type: "danger", time: "Day 50" }
                                ].map((alert, i) => (
                                    <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full ${alert.type === 'danger' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : alert.type === 'warning' ? 'bg-agri-amber shadow-[0_0_8px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white/90">{alert.text}</p>
                                            <p className="text-[10px] text-white/40 font-mono mt-1">{alert.time} • Projected</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT PANEL: TIMELINE VIEW */}
                    <div className="lg:col-span-8 animate-in slide-in-from-right duration-700">
                        {!isActive ? (
                            <div className="h-full flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
                                <div className="w-24 h-24 bg-agri-green/10 rounded-full flex items-center justify-center mb-6">
                                    <Activity className="w-10 h-10 text-agri-green/50 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Systems Standby</h2>
                                <p className="text-muted-foreground max-w-sm">Configure your crop data and click start to generate the AI-driven precision lifecycle timeline.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Progress Header */}
                                <Card className="bg-black/60 border-agri-green/20 backdrop-blur-xl border relative overflow-hidden">
                                    <div className="absolute top-0 left-0 h-1 bg-agri-green animate-[shimmer_2s_infinite]" />
                                    <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-agri-green uppercase tracking-tighter">Total Growth Progress</span>
                                                <span className="text-2xl font-black text-white">{currentProgress}%</span>
                                            </div>
                                            <Progress value={currentProgress} className="h-2 bg-white/5" />
                                        </div>
                                        <div className="flex gap-6 border-l border-white/10 pl-6 h-full text-white">
                                            <div className="text-center px-4">
                                                <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Current State</p>
                                                <Badge variant="outline" className="bg-agri-green/10 border-agri-green/30 text-agri-green font-bold">Vegetative</Badge>
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Days Sown</p>
                                                <p className="text-xl font-bold font-mono">32 <span className="text-xs text-white/40">DAYS</span></p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Vertical Timeline */}
                                <div className="relative pl-8 md:pl-0">
                                    {/* Central Line */}
                                    <div className="absolute left-10 md:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-agri-green via-agri-amber to-transparent md:-translate-x-px" />

                                    <div className="space-y-12">
                                        {STAGES_TEMPLATE.map((stage, idx) => {
                                            const isEven = idx % 2 === 0;
                                            const isCompleted = idx < 2;
                                            const isCurrent = idx === 2;

                                            let days = 0;
                                            for (let i = 0; i < idx; i++) days += STAGES_TEMPLATE[i].durationDays;

                                            return (
                                                <div key={stage.id} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''} group`}>
                                                    {/* Central Dot */}
                                                    <div className={`absolute left-10 md:left-1/2 w-6 h-6 rounded-full border-4 z-20 md:-translate-x-3 transition-all duration-500 scale-100 group-hover:scale-125
                            ${isCompleted ? 'bg-agri-green border-black' : isCurrent ? 'bg-black border-agri-green animate-pulse' : 'bg-zinc-800 border-zinc-700'}`}
                                                    />

                                                    {/* Date Indicator (Mobile) */}
                                                    <div className="md:hidden mb-4 ml-6 text-xs font-bold text-agri-green/80 flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" /> {calculateDate(days)}
                                                    </div>

                                                    {/* Card */}
                                                    <div className={`w-full md:w-[45%] ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                                                        <Card className={`bg-white/5 border-white/5 transition-all duration-500 group-hover:border-white/20 hover:translate-y-[-4px] overflow-hidden
                              ${isCurrent ? 'ring-2 ring-agri-green/30 shadow-[0_0_30px_rgba(56,163,165,0.15)] bg-white/10' : ''}`}>

                                                            {/* Background Gradient */}
                                                            {isCurrent && <div className="absolute top-0 right-0 w-32 h-32 bg-agri-green/5 blur-3xl pointer-events-none" />}

                                                            <CardHeader className="p-4 pb-2">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <stage.icon className={`w-5 h-5 ${isCompleted || isCurrent ? 'text-agri-green' : 'text-zinc-600'}`} />
                                                                    <div className="hidden md:block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">{calculateDate(days)}</div>
                                                                </div>
                                                                <CardTitle className={`text-base font-bold ${!isCompleted && !isCurrent ? 'text-white/40' : 'text-white'}`}>
                                                                    {stage.title}
                                                                </CardTitle>
                                                            </CardHeader>

                                                            <CardContent className="p-4 pt-0 space-y-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-bold text-agri-green uppercase tracking-widest">Key Actions</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {stage.actions.map((act, i) => (
                                                                            <Badge key={i} variant="outline" className={`bg-transparent text-[10px] py-0 border-white/10 font-normal ${!isCompleted && !isCurrent ? 'opacity-30' : 'opacity-100'}`}>{act}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-bold text-white/30 uppercase">Fertilizer</p>
                                                                        <p className={`text-[11px] leading-tight ${!isCompleted && !isCurrent ? 'text-white/20' : 'text-white/80'}`}>{stage.fertilizer}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-bold text-white/30 uppercase">Irrigation</p>
                                                                        <p className={`text-[11px] leading-tight ${!isCompleted && !isCurrent ? 'text-white/20' : 'text-white/80'}`}>{stage.irrigation}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-2">
                                                                    <div className="flex gap-1">
                                                                        {stage.risks.map((r, i) => (
                                                                            <div key={i} title={r} className={`w-1 h-3 rounded-full ${isCurrent ? 'bg-agri-amber' : 'bg-white/10'}`} />
                                                                        ))}
                                                                    </div>
                                                                    {isCompleted ? (
                                                                        <ShieldCheck className="w-4 h-4 text-agri-green" />
                                                                    ) : isCurrent && (
                                                                        <TrendingUp className="w-4 h-4 text-agri-green animate-bounce" />
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>

                                                    {/* Stage Spacing (Hidden on Mobile) */}
                                                    <div className={`hidden md:block w-full md:w-[45%] text-right ${isEven ? 'md:pl-12 order-last' : 'md:pr-12'}`}>
                                                        <div className="flex flex-col h-full justify-center">
                                                            <span className={`text-4xl font-black font-mono transition-colors duration-500 opacity-10
                                ${isCompleted || isCurrent ? 'text-agri-green' : 'text-white'}`}>
                                                                0{stage.id}
                                                            </span>
                                                            <div className="h-0.5 w-12 ml-auto bg-gradient-to-r from-transparent to-agri-green/20" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgriChrono;
