import { createClient } from "./server";
import type { EmailOtpType } from "@supabase/supabase-js";


export async function getAuthClaims() {
  const supabase = await createClient();
  return await supabase.auth.getClaims();
}

export async function verifyOtp(params: {
  type: EmailOtpType;
  token_hash: string;
}) {
  const supabase = await createClient();
  return await supabase.auth.verifyOtp(params);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user ?? null, error };
}

