import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [optedIn, setOptedIn] = useState(true);
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
        .select("email_campaigns")
        .eq("id", user.id)
        .maybeSingle();
      setOptedIn(data?.email_campaigns ?? true);
      setLoading(false);
    })();
  }, [user]);

  const onToggle = async (next: boolean) => {
    if (!user) return;
    setSaving(true);
    setOptedIn(next);
    const { error } = await supabase
      .from("users")
      .update({ email_campaigns: next })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setOptedIn(!next);
      toast.error("Could not update preferences");
    } else {
      toast.success(next ? "Subscribed to campaign emails" : "Unsubscribed from campaign emails");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage your account and notification preferences.
      </p>

      <section className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Email notifications</h2>
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
            checked={optedIn}
            disabled={saving}
            onCheckedChange={onToggle}
          />
        </div>
      </section>
    </div>
  );
}
