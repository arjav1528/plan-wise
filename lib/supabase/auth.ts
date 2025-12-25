"use client";

import { createClient } from "./client";
import type { User } from "@supabase/supabase-js";


export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
  };
}


export async function signIn(credentials: SignInCredentials) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword(credentials);
}

export async function signUp(credentials: SignUpCredentials) {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: credentials.options,
  });
}

export async function signOut() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<{ user: User | null; error: any }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user ?? null, error };
}

export async function getUserEmail(): Promise<string | null> {
  const { user } = await getCurrentUser();
  return user?.email ?? null;
}

export async function resetPasswordForEmail(
  email: string,
  options?: { redirectTo?: string }
) {
  const supabase = createClient();
  return await supabase.auth.resetPasswordForEmail(email, options);
}

export async function updatePassword(password: string) {
  const supabase = createClient();
  return await supabase.auth.updateUser({ password });
}

export async function getAuthClaims() {
  const supabase = createClient();
  return await supabase.auth.getClaims();
}

