import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthClaims } from "@/lib/supabase/auth-server";

async function AuthCheck({ children }: { children: React.ReactNode }) {
  const { data } = await getAuthClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      }
    >
      <AuthCheck>{children}</AuthCheck>
    </Suspense>
  );
}

