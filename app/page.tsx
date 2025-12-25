import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

async function AuthRedirect() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // If user is authenticated, redirect to dashboard
  if (data?.claims) {
    redirect("/dashboard");
  }

  return null;
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>
      <div className="flex flex-col gap-8 items-center max-w-2xl px-4 text-center">
        <h1 className="text-4xl font-bold">Welcome to Plan Wise</h1>
        <p className="text-lg text-muted-foreground">
          Get started by signing in or creating an account
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
