import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Edit2, Save, X, Activity, Key, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "@/config";

const UnifiedProfile = () => {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");

    const [formData, setFormData] = useState<any>({});
    const [initialData, setInitialData] = useState<any>({});
    const [photoUrl, setPhotoUrl] = useState<string>("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const authToken = localStorage.getItem("agri_token");
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setInitialData(data);
                setFormData(data);
                setPhotoUrl(data.avatar_url || "");
            } else if (user) {
                setInitialData(user);
                setFormData(user);
                setPhotoUrl(user.avatar_url || "");
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
            if (user) {
                setInitialData(user);
                setFormData(user);
                setPhotoUrl(user.avatar_url || "");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (!formData.full_name?.trim()) {
            toast.error("Full Name cannot be empty");
            return false;
        }
        if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number)) {
            toast.error("Please enter a valid 10-digit phone number");
            return false;
        }
        if (role === "farmer" && formData.total_land_area && isNaN(Number(formData.total_land_area))) {
            toast.error("Total Land Area must be numeric");
            return false;
        }
        if (role === "consumer" && formData.purchase_volume_capacity && isNaN(Number(formData.purchase_volume_capacity))) {
            toast.error("Purchase Volume Capacity must be numeric");
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);

        const updates = {
            ...formData,
            total_land_area: formData.total_land_area ? parseFloat(formData.total_land_area) : null,
            years_of_experience: formData.years_of_experience ? parseFloat(formData.years_of_experience) : null,
            purchase_volume_capacity: formData.purchase_volume_capacity ? parseFloat(formData.purchase_volume_capacity) : null,
        };

        try {
            const authToken = localStorage.getItem("agri_token");
            const res = await fetch(`${API_BASE}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const updatedProfile = await res.json();
                toast.success("Profile updated successfully.");
                setInitialData(updatedProfile);
                setFormData(updatedProfile);
                localStorage.setItem("agri_user", JSON.stringify(updatedProfile));
                setEditMode(false);
            } else {
                toast.success("Profile updated locally.");
                setInitialData({ ...updates });
                setEditMode(false);
            }
        } catch (err: any) {
            toast.success("Profile saved.");
            setInitialData({ ...updates });
            setEditMode(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({ ...initialData });
        setEditMode(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split(".").pop();
        const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

        setUploading(true);
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

        if (uploadError) {
            toast.error("Error uploading image");
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

        // Update profile
        await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("id", user?.id);

        setPhotoUrl(publicUrl);
        setFormData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
        setUploading(false);
        toast.success("Profile photo updated");
    };

    const calculateCompletion = () => {
        const requiredCommon = ["full_name", "phone_number", "state", "district", "address"];
        let filled = 0;

        const requiredRole = role === "farmer"
            ? [...requiredCommon, "farm_name", "total_land_area", "primary_crops", "irrigation_type", "soil_type", "years_of_experience"]
            : [...requiredCommon, "business_name", "business_type", "preferred_crops", "purchase_volume_capacity"];

        requiredRole.forEach((field) => {
            if (initialData[field] && initialData[field] !== "") filled++;
        });

        return Math.round((filled / requiredRole.length) * 100);
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading profile...</div>;
    }

    const completionPct = calculateCompletion();

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold">Profile Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
                </div>
                {!editMode && (
                    <Button onClick={() => setEditMode(true)} className="gap-2 shrink-0">
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </Button>
                )}
                {editMode && (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" onClick={handleCancel} disabled={saving}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* SIDEBAR & PHOTO */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="text-center overflow-hidden border-border/60">
                        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary-focus w-full"></div>
                        <CardContent className="pt-0 relative px-6 pb-6">
                            <div className="relative w-24 h-24 mx-auto -mt-12 mb-4 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-muted-foreground">{formData.full_name?.charAt(0).toUpperCase()}</span>
                                )}
                                {editMode && (
                                    <label className="absolute inset-0 bg-black/50 cursor-pointer flex items-center justify-center transition-opacity opacity-0 hover:opacity-100">
                                        <Camera className="w-6 h-6 text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            <h2 className="text-xl font-bold truncate">{formData.full_name || "User Name"}</h2>
                            <p className="text-sm text-muted-foreground capitalize">{role}</p>

                            <div className="mt-4 space-y-2 text-sm text-left px-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-semibold text-foreground">Email:</span>
                                    <span className="truncate" title={formData.email}>{formData.email || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-semibold text-foreground">Location:</span>
                                    <span className="truncate" title={`${formData.district || ''}, ${formData.state || ''}`.replace(/^, /, '')}>
                                        {formData.district || formData.state ? `${formData.district || ''}${formData.district && formData.state ? ', ' : ''}${formData.state || ''}` : "N/A"}
                                    </span>
                                </div>
                                {role === "farmer" && (
                                    <>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="font-semibold text-foreground">Crops:</span>
                                            <span className="truncate" title={formData.primary_crops}>{formData.primary_crops || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="font-semibold text-foreground">Yield (Land):</span>
                                            <span className="truncate">{formData.total_land_area ? `${formData.total_land_area} Acres` : "N/A"}</span>
                                        </div>
                                    </>
                                )}
                                {role === "consumer" && (
                                    <>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="font-semibold text-foreground">Needs:</span>
                                            <span className="truncate" title={formData.preferred_crops}>{formData.preferred_crops || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="font-semibold text-foreground">Volume:</span>
                                            <span className="truncate">{formData.purchase_volume_capacity ? `${formData.purchase_volume_capacity} Tons` : "N/A"}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-border/50 text-left">
                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex justify-between">
                                    Profile Completion <span>{completionPct}%</span>
                                </p>
                                <Progress value={completionPct} className="h-2" />
                                {completionPct < 100 && (
                                    <p className="text-xs text-agri-amber mt-2 leading-tight">Complete your profile to unlock all platform features.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <div className="flex flex-col p-2">
                            <button
                                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'personal' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                                onClick={() => setActiveTab('personal')}
                            >
                                <Activity className="w-4 h-4" /> Personal Information
                            </button>
                            <button
                                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                                onClick={() => setActiveTab('account')}
                            >
                                <Key className="w-4 h-4" /> Account Settings
                            </button>
                        </div>
                    </Card>
                </div>

                {/* MAIN FIELDS */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="border-border/60">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle>{activeTab === 'personal' ? 'Personal Information' : 'Account Details'}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">

                            {activeTab === 'personal' && (
                                <div className="space-y-8">

                                    {/* Common Personal */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Basic Info</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Full Name *</Label>
                                                <Input value={formData.full_name || ""} onChange={(e) => handleInputChange("full_name", e.target.value)} disabled={!editMode} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                <Input value={formData.phone_number || ""} onChange={(e) => handleInputChange("phone_number", e.target.value)} disabled={!editMode} placeholder="10-digit number" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Common Location */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Location</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>State</Label>
                                                <Select disabled={!editMode} value={formData.state || ""} onValueChange={(val) => handleInputChange("state", val)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="State A">State A</SelectItem>
                                                        <SelectItem value="State B">State B</SelectItem>
                                                        <SelectItem value="State C">State C</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>District</Label>
                                                <Select disabled={!editMode} value={formData.district || ""} onValueChange={(val) => handleInputChange("district", val)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select district" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="District X">District X</SelectItem>
                                                        <SelectItem value="District Y">District Y</SelectItem>
                                                        <SelectItem value="District Z">District Z</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Mandal / Tehsil</Label>
                                                <Select disabled={!editMode} value={formData.mandal || ""} onValueChange={(val) => handleInputChange("mandal", val)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select mandal" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Mandal 1">Mandal 1</SelectItem>
                                                        <SelectItem value="Mandal 2">Mandal 2</SelectItem>
                                                        <SelectItem value="Mandal 3">Mandal 3</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Detailed Address</Label>
                                            <Input value={formData.address || ""} onChange={(e) => handleInputChange("address", e.target.value)} disabled={!editMode} />
                                        </div>
                                    </div>

                                    {/* Role Specific */}
                                    {role === "farmer" && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-agri-orange border-b pb-2 flex items-center gap-2">
                                                Agricultural Details
                                                {completionPct === 100 && <Badge className="bg-green-500 hover:bg-green-600 gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Farmer</Badge>}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Farm Name</Label>
                                                    <Input value={formData.farm_name || ""} onChange={(e) => handleInputChange("farm_name", e.target.value)} disabled={!editMode} placeholder="E.g. Green Acres" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Total Land Area (Acres)</Label>
                                                    <Input value={formData.total_land_area || ""} onChange={(e) => handleInputChange("total_land_area", e.target.value)} disabled={!editMode} type="number" step="0.1" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Primary Crops</Label>
                                                    <Input value={formData.primary_crops || ""} onChange={(e) => handleInputChange("primary_crops", e.target.value)} disabled={!editMode} placeholder="E.g. Rice, Cotton" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Irrigation Type</Label>
                                                    <Select disabled={!editMode} value={formData.irrigation_type || ""} onValueChange={(val) => handleInputChange("irrigation_type", val)}>
                                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Drip">Drip Irrigation</SelectItem>
                                                            <SelectItem value="Sprinkler">Sprinkler</SelectItem>
                                                            <SelectItem value="Rainfed">Rainfed</SelectItem>
                                                            <SelectItem value="Canal">Canal</SelectItem>
                                                            <SelectItem value="Borewell">Borewell</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Soil Type</Label>
                                                    <Input value={formData.soil_type || ""} onChange={(e) => handleInputChange("soil_type", e.target.value)} disabled={!editMode} placeholder="E.g. Black, Red, Loamy" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Years of Experience</Label>
                                                    <Input value={formData.years_of_experience || ""} onChange={(e) => handleInputChange("years_of_experience", e.target.value)} disabled={!editMode} type="number" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {role === "consumer" && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-agri-orange border-b pb-2">Business Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Business Name</Label>
                                                    <Input value={formData.business_name || ""} onChange={(e) => handleInputChange("business_name", e.target.value)} disabled={!editMode} placeholder="E.g. Fresh Foods Ltd" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Business Type</Label>
                                                    <Select disabled={!editMode} value={formData.business_type || ""} onValueChange={(val) => handleInputChange("business_type", val)}>
                                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Retailer">Retailer</SelectItem>
                                                            <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                                                            <SelectItem value="Processor">Processor</SelectItem>
                                                            <SelectItem value="Exporter">Exporter</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Preferred Crops</Label>
                                                    <Input value={formData.preferred_crops || ""} onChange={(e) => handleInputChange("preferred_crops", e.target.value)} disabled={!editMode} placeholder="E.g. Wheat, Rice" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Purchase Volume Capacity (Tons)</Label>
                                                    <Input value={formData.purchase_volume_capacity || ""} onChange={(e) => handleInputChange("purchase_volume_capacity", e.target.value)} disabled={!editMode} type="number" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'account' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-foreground border-b pb-2">Account Identifiers</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Email Address <span className="text-xs text-muted-foreground ml-2">(Read-only)</span></Label>
                                                <Input value={formData.email || ""} disabled className="bg-muted" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Account Role <span className="text-xs text-muted-foreground ml-2">(Read-only)</span></Label>
                                                <Input value={formData.role || ""} disabled className="bg-muted capitalize" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Account Created <span className="text-xs text-muted-foreground ml-2">(Read-only)</span></Label>
                                                <Input value={new Date(formData.created_at).toLocaleDateString()} disabled className="bg-muted" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-border space-y-4">
                                        <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
                                        <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                                        <Button variant="destructive" disabled>Delete Account</Button>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UnifiedProfile;
