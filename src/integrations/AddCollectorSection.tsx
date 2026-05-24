import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminCreateCollector } from "@/lib/adminCollectors.functions";

type Credentials = { email: string; password: string };

const empty = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  counties: "",
  description: "",
};

export function AddCollectorSection() {
  const createCollector = useServerFn(adminCreateCollector);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);

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
      const res = await createCollector({
        data: {
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          counties,
          description: form.description,
        },
      });
      setCreds({ email: res.email, password: res.password });
      setForm(empty);
      toast.success("Collector created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create collector");
    } finally {
      setSubmitting(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-green-800" />
        <div>
          <h2 className="text-xl font-bold text-green-950">Add a new collector</h2>
          <p className="text-sm text-gray-600">
            Create a collector company and generate login credentials.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" value={form.companyName} onChange={update("companyName")} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contact person</Label>
          <Input id="contactName" value={form.contactName} onChange={update("contactName")} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={update("email")} required maxLength={255} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={update("phone")} maxLength={32} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="counties">Service counties (comma separated)</Label>
          <Input id="counties" value={form.counties} onChange={update("counties")} placeholder="Cluj, Bucuresti, Timis" required />
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
              "Create collector & generate credentials"
            )}
          </Button>
        </div>
      </form>

      {creds && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            Credentials generated — copy and send to the collector now. The password won't be shown again.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <CredRow label="Email" value={creds.email} onCopy={() => copy(creds.email)} />
            <CredRow label="Password" value={creds.password} onCopy={() => copy(creds.password)} mono />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setCreds(null)}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

function CredRow({ label, value, onCopy, mono }: { label: string; value: string; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`truncate ${mono ? "font-mono" : ""} text-gray-900`}>{value}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
