import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "citizen" | "collector" | "admin";

/** Returns the public.users.role for the signed-in user. */
export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<UserRole> => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return ((data?.role as UserRole | undefined) ?? "citizen");
    },
  });
}
