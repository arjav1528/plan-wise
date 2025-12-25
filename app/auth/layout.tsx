import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // If user is authenticated, redirect to dashboard
  if (data?.claims) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

