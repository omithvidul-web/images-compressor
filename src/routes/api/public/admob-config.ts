import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/admob-config")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const { data, error } = await supabase
          .from("admob_config")
          .select("publisher_id,app_id,app_open_id,banner_id,interstitial_id,rewarded_id,rewarded_interstitial_id,native_id,is_active")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (error) {
          return new Response(JSON.stringify({ error: "config_unavailable" }), {
            status: 500,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }
        return new Response(JSON.stringify(data ?? {}), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=60",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
