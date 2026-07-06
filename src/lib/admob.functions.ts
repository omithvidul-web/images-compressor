import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AdmobConfig = {
  publisher_id: string;
  app_id: string;
  app_open_id: string;
  banner_id: string;
  interstitial_id: string;
  rewarded_id: string;
  rewarded_interstitial_id: string;
  native_id: string;
  is_active: boolean;
};

const EMPTY: AdmobConfig = {
  publisher_id: "",
  app_id: "",
  app_open_id: "",
  banner_id: "",
  interstitial_id: "",
  rewarded_id: "",
  rewarded_interstitial_id: "",
  native_id: "",
  is_active: true,
};

export const getAdmobConfig = createServerFn({ method: "GET" }).handler(async () => {
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
    console.error("getAdmobConfig", error);
    return EMPTY;
  }
  return (data ?? EMPTY) as AdmobConfig;
});

export const updateAdmobConfig = createServerFn({ method: "POST" })
  .inputValidator((data: { secret: string; config: Partial<AdmobConfig> }) => {
    if (typeof data?.secret !== "string" || !data.secret) throw new Error("Missing secret");
    if (!data.config || typeof data.config !== "object") throw new Error("Missing config");
    return data;
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMOB_ADMIN_SECRET;
    if (!expected || data.secret !== expected) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Partial<AdmobConfig> = {};
    const keys: (keyof AdmobConfig)[] = [
      "publisher_id",
      "app_id",
      "app_open_id",
      "banner_id",
      "interstitial_id",
      "rewarded_id",
      "rewarded_interstitial_id",
      "native_id",
      "is_active",
    ];
    for (const k of keys) {
      const v = data.config[k];
      if (v === undefined) continue;
      if (k === "is_active") (patch as Record<string, unknown>)[k] = Boolean(v);
      else (patch as Record<string, unknown>)[k] = String(v ?? "").trim();
    }
    const { data: row, error } = await supabaseAdmin
      .from("admob_config")
      .update(patch)
      .eq("singleton", true)
      .select("publisher_id,app_id,app_open_id,banner_id,interstitial_id,rewarded_id,rewarded_interstitial_id,native_id,is_active")
      .single();
    if (error) throw new Error(error.message);
    return row as AdmobConfig;
  });

export const verifyAdmobAdminSecret = createServerFn({ method: "POST" })
  .inputValidator((data: { secret: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMOB_ADMIN_SECRET;
    return { ok: Boolean(expected) && data.secret === expected };
  });
