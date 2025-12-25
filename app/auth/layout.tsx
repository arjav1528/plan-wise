import { redirect } from "next/navigation";
import { getAuthClaims } from "@/lib/supabase/auth-server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = await getAuthClaims();

  // If user is authenticated, redirect to dashboard
  if (data?.claims) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

