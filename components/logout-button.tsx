"use client";

import { signOut } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
  )

  // return <Button onClick={logout}>Logout</Button>;
}
