import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const empty = {
  email: "",
  password: "",
  companyName: "",
  counties: "",
  pickupMethods: "both",
  description: "",
  rating: "4.0",
};

export function AddCollectorSection() {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  const update =
    (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const counties = form.counties
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (counties.length === 0) {
      toast.error("Add at least one county");
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be signed in as admin");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-collector",
        {
          body: {
            email: form.email,
            password: form.password,
            company_name: form.companyName,
            service_area_counties: counties,
            pickup_methods: form.pickupMethods,
            description: form.description,
            rating: Number(form.rating) || 0,
          },
        },
      );

      if (error) throw error;
      console.log("Created:", data);
      setForm(empty);
      toast.success("Collector created");
    } catch (err) {
      console.error("Failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create collector");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-green-800" />
        <div>
          <h2 className="text-xl font-bold text-green-950">Add a new collector</h2>
          <p className="text-sm text-gray-600">
            Creates a login account and collector profile via the create-collector edge function.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Login email</Label>
          <Input id="email" type="email" value={form.email} onChange={update("email")} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Temporary password</Label>
          <Input id="password" type="text" value={form.password} onChange={update("password")} required minLength={8} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" value={form.companyName} onChange={update("companyName")} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rating">Initial rating</Label>
          <Input id="rating" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={update("rating")} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="counties">Service counties (comma separated)</Label>
          <Input id="counties" value={form.counties} onChange={update("counties")} placeholder="Cluj, Bihor, Sălaj" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupMethods">Pickup methods</Label>
          <Input id="pickupMethods" value={form.pickupMethods} onChange={update("pickupMethods")} placeholder="both | pickup | dropoff" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea id="description" value={form.description} onChange={update("description")} rows={3} maxLength={1000} />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={submitting} className="bg-green-800 text-white hover:bg-green-900">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              "Create collector"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
