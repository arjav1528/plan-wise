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
            <Suspense fallback={
                <div className="flex items-center border-b p-4 md:hidden">
                    <div className="h-5 w-5 bg-muted animate-pulse rounded mr-2" />
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </div>
            }>
                <MobileNav />
            </Suspense>
            <Suspense fallback={
                <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex-1 overflow-auto py-4">
                        <div className="px-2">
                            <div className="h-9 w-full bg-muted animate-pulse rounded mb-4" />
                        </div>
                    </div>
                </aside>
            }>
                <Sidebar />
            </Suspense>
            <main className="flex-1 overflow-y-auto w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                    {children}
                </Suspense>
            </main>
        </div>
    );
}
