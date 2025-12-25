import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background">
            <MobileNav />
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                    {children}
                </Suspense>
            </main>
        </div>
    );
}
