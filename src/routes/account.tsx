import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, User as UserIcon, Mail, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "My Account — e-Return" }] }),
});

type Profile = {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  email_campaigns: boolean | null;
  role: string | null;
  created_at: string | null;
};

const EMPTY: Profile = {
  name: "", email: "", phone: "", address: "",
  email_campaigns: true, role: "citizen", created_at: null,
};

function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("name, email, phone, address, email_campaigns, role, created_at")
        .eq("id", user.id)
        .maybeSingle();
      const row = (data ?? {}) as Record<string, unknown>;
      setProfile({
        ...EMPTY,
        ...row,
        email: (row.email as string | undefined) ?? user.email ?? "",
      });
      setLoading(false);
    })();
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({
        name: profile.name,
        phone: profile.phone,
        county: profile.county,
        address: profile.address,
      } as never)
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Could not save profile");
    else toast.success("Profile updated");
  };

  const onToggleCampaigns = async (next: boolean) => {
    if (!user) return;
    setProfile((p) => ({ ...p, email_campaigns: next }));
    const { error } = await supabase
      .from("users")
      .update({ email_campaigns: next })
      .eq("id", user.id);
    if (error) {
      setProfile((p) => ({ ...p, email_campaigns: !next }));
      toast.error("Could not update preference");
    } else {
      toast.success(next ? "Subscribed to campaign emails" : "Unsubscribed from campaign emails");
    }
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading account…
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-sm text-muted-foreground">
            Personalize your e-Return experience.
          </p>
        </div>
      </header>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Personal details</h2>
        <form onSubmit={onSave} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <input
              id="name"
              value={profile.name ?? ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <input
              id="email" value={profile.email ?? ""} disabled
              className="mt-2 w-full rounded-md border border-input bg-muted px-3 py-2.5 text-sm text-muted-foreground"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <input
              id="phone"
              value={profile.phone ?? ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+40 7xx xxx xxx"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <Label htmlFor="county">County</Label>
            <input
              id="county"
              value={profile.county ?? ""}
              onChange={(e) => setProfile({ ...profile, county: e.target.value })}
              placeholder="Cluj"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <input
              id="address"
              value={profile.address ?? ""}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Street, number, city"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Role: <span className="font-medium text-foreground">{profile.role ?? "citizen"}</span>
              {profile.created_at && <> · Member since {new Date(profile.created_at).toLocaleDateString()}</>}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="space-y-1">
            <Label htmlFor="email_campaigns" className="text-base">
              Campaign emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new recycling campaigns and promotions in your area.
            </p>
          </div>
          <Switch
            id="email_campaigns"
            checked={profile.email_campaigns ?? true}
            onCheckedChange={onToggleCampaigns}
          />
        </div>
      </section>
    </main>
  );
}
