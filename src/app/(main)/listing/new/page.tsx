"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  DoorOpen, Building2, Users, BedDouble,
  Wifi, Snowflake, WashingMachine, UtensilsCrossed, Car, Zap, Droplets, Sofa, Shield, Camera,
  MapPin, IndianRupee, CalendarDays, ImagePlus, FileText, Sparkles, ArrowRight, ArrowLeft, Check,
} from "lucide-react";

const propertyTypes = [
  { value: "room", label: "Room", icon: DoorOpen, desc: "Single or shared room" },
  { value: "apartment", label: "Apartment", icon: Building2, desc: "Full apartment or flat" },
  { value: "pg", label: "PG", icon: Users, desc: "Paying guest accommodation" },
  { value: "hostel", label: "Hostel", icon: BedDouble, desc: "Hostel bed or dorm" },
];

const amenityOptions = [
  { name: "WiFi", icon: Wifi },
  { name: "AC", icon: Snowflake },
  { name: "Laundry", icon: WashingMachine },
  { name: "Kitchen", icon: UtensilsCrossed },
  { name: "Parking", icon: Car },
  { name: "Power Backup", icon: Zap },
  { name: "Water Supply", icon: Droplets },
  { name: "Furnished", icon: Sofa },
  { name: "Security", icon: Shield },
  { name: "CCTV", icon: Camera },
];

const STEPS = [
  { label: "Basics", icon: FileText },
  { label: "Location", icon: MapPin },
  { label: "Pricing", icon: IndianRupee },
  { label: "Details", icon: Sparkles },
];

export default function NewListingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [selectedType, setSelectedType] = useState("");
  const [photos, setPhotos] = useState<{ url: string; order: number; alt: string; preview?: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    priceMonthly: "",
    deposit: "",
    propertyType: "",
    address: "",
    city: "",
    neighborhood: "",
    latitude: "",
    longitude: "",
    availableFrom: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }
    if ((session.user as { role: string }).role !== "landlord") { router.push("/dashboard"); }
  }, [session, status, router]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAmenity(name: string) {
    setAmenities((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.title.trim()) return "Please enter a property title";
      if (!form.description.trim()) return "Please enter a description";
      if (!form.propertyType) return "Please select a property type";
    }
    if (step === 1) {
      if (!form.address.trim()) return "Please enter the full address";
      if (!form.city.trim()) return "Please enter the city";
      if (!form.latitude || !form.longitude) return "Please enter the coordinates";
    }
    if (step === 2) {
      if (!form.priceMonthly || Number(form.priceMonthly) <= 0) return "Please enter the monthly rent";
    }
    return null;
  }

  function nextStep() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prevStep() { setError(""); if (step > 0) setStep(step - 1); }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      setError("Maximum 5 photos allowed");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Upload failed");
        return;
      }

      setPhotos((prev) => [...prev, ...data.data]);
    } catch {
      setError("Failed to upload photos");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    const body = {
      title: form.title,
      description: form.description,
      priceMonthly: Math.round(Number(form.priceMonthly) * 100),
      deposit: form.deposit ? Math.round(Number(form.deposit) * 100) : null,
      propertyType: form.propertyType,
      address: form.address,
      city: form.city,
      neighborhood: form.neighborhood || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      availableFrom: form.availableFrom || null,
      amenities,
      photos: photos.map((p, i) => ({ url: p.url, order: i, alt: p.alt })),
      landlordId: session!.user.id,
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || "Failed to create listing"); return; }
      router.push(`/listing/${data.data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session || (session.user as { role: string }).role !== "landlord") return null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-3">
          <Building2 className="w-3.5 h-3.5" />
          New Listing
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          List Your Property
        </h1>
        <p className="mt-2 text-muted-foreground">
          Reach students and professionals looking for housing
        </p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center justify-center gap-1 mb-10">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => { if (i <= step) { setError(""); setStep(i); } }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                i === step
                  ? "bg-primary text-white shadow-warm-2 scale-105"
                  : i < step
                  ? "bg-accent-light text-accent cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
              }`}
            >
              {i < step ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-6 sm:w-10 h-0.5 mx-1 rounded-full transition-colors ${i < step ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-[14px] bg-red-50 dark:bg-red-950 border border-destructive p-4 text-sm text-destructive animate-shake">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-[20px] border border-border bg-surface shadow-warm-2 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-highlight to-accent" style={{ width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 0.5s ease" }} />

        <div className="p-6 sm:p-8">
          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Basic Information</h2>
                <p className="text-sm text-muted-foreground">Tell us about your property</p>
              </div>

              <Input
                label="Property Title"
                placeholder="e.g. Spacious room near Tribhuvan University"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  className="rounded-[10px] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Describe the property — nearby landmarks, rules, what's included, neighborhood vibe..."
                  required
                />
                <p className="text-xs text-muted-foreground text-right">{form.description.length}/500</p>
              </div>

              {/* Property type cards */}
              <div>
                <label className="text-sm font-semibold text-foreground">Property Type</label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {propertyTypes.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setSelectedType(value); updateForm("propertyType", value); }}
                      className={`flex items-start gap-3 p-4 rounded-[14px] border-2 text-left transition-all duration-200 ${
                        selectedType === value
                          ? "border-primary bg-primary-light shadow-warm-1"
                          : "border-border hover:border-primary/30 hover:bg-muted"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedType === value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Location</h2>
                <p className="text-sm text-muted-foreground">Where is your property located?</p>
              </div>

              <Input
                label="Full Address"
                placeholder="e.g. Kirtipur-4, Near TU Main Gate"
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Kathmandu"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  required
                />
                <Input
                  label="Neighborhood"
                  placeholder="Thamel"
                  value={form.neighborhood}
                  onChange={(e) => updateForm("neighborhood", e.target.value)}
                />
              </div>

              <div className="rounded-[14px] border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <label className="text-sm font-semibold text-foreground">Pin Location</label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Enter coordinates or use a map to find your property location
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    placeholder="27.7172"
                    value={form.latitude}
                    onChange={(e) => updateForm("latitude", e.target.value)}
                    required
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    placeholder="85.3240"
                    value={form.longitude}
                    onChange={(e) => updateForm("longitude", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Pricing & Availability</h2>
                <p className="text-sm text-muted-foreground">Set your rent and deposit amounts</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-[14px] border-2 border-primary/20 bg-primary-light/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Monthly Rent</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="8000"
                    value={form.priceMonthly}
                    onChange={(e) => updateForm("priceMonthly", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">Amount in NPR per month</p>
                </div>

                <div className="rounded-[14px] border border-border bg-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Security Deposit</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="16000"
                    value={form.deposit}
                    onChange={(e) => updateForm("deposit", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">One-time refundable deposit</p>
                </div>
              </div>

              <div className="rounded-[14px] border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Available From</span>
                </div>
                <Input
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => updateForm("availableFrom", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Amenities & Photos */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Amenities & Photos</h2>
                <p className="text-sm text-muted-foreground">What does your property offer?</p>
              </div>

              {/* Amenity grid */}
              <div>
                <label className="text-sm font-semibold text-foreground">Amenities</label>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {amenityOptions.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleAmenity(name)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-[12px] border-2 transition-all duration-200 active:scale-[0.95] ${
                        amenities[name]
                          ? "border-primary bg-primary-light text-primary shadow-warm-1"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-semibold leading-tight text-center">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-sm font-semibold text-foreground">Property Photos <span className="text-muted-foreground font-normal">({photos.length}/5)</span></label>

                {/* Uploaded photos */}
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] bg-[var(--bg-elevated)] group">
                        <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-white text-xs font-bold">✕</span>
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[var(--accent)]/80 text-white text-[10px] font-semibold">Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {photos.length < 5 && (
                  <label className={`mt-3 block border-2 border-dashed border-[var(--border)] rounded-[14px] p-8 text-center hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/[0.03] transition-all duration-200 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mb-3" />
                        <p className="text-sm text-white/50">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 mx-auto text-white/15 mb-3" />
                        <p className="text-sm font-medium text-white/60">Click to upload photos</p>
                        <p className="text-xs text-white/25 mt-1">JPG, PNG up to 5MB each · Max 5 photos</p>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Preview summary */}
              <div className="rounded-[14px] border border-border bg-muted/50 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Listing Preview</h3>
                <div className="space-y-2 text-sm">
                  {form.title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title</span>
                      <span className="font-medium text-foreground truncate ml-4 max-w-[200px]">{form.title}</span>
                    </div>
                  )}
                  {form.propertyType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium text-foreground capitalize">{form.propertyType}</span>
                    </div>
                  )}
                  {form.city && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{form.neighborhood ? `${form.neighborhood}, ${form.city}` : form.city}</span>
                    </div>
                  )}
                  {form.priceMonthly && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent</span>
                      <span className="font-bold text-primary price-display">NPR {Number(form.priceMonthly).toLocaleString()}/mo</span>
                    </div>
                  )}
                  {Object.values(amenities).some(Boolean) && (
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Amenities</span>
                      <span className="font-medium text-foreground text-right max-w-[200px]">
                        {Object.entries(amenities).filter(([,v]) => v).map(([k]) => k).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="px-6 sm:px-8 py-5 border-t border-border bg-muted/30 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={prevStep} size="md">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} size="md">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Publish Listing
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
