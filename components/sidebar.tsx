"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Settings, LogOut, LayoutGrid, Map, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Project, DB_TABLES, Profile } from "@/lib/types";



export function Sidebar() {

    
    const pathname = usePathname();
    const [projectsList, setProjectsList] = useState<Project[]>([]);

    const [email, setEmail] = useState<string | null>(null);



    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from(DB_TABLES.PROJECTS).select("*");
            if (error) {
                console.error(error);
            }
            setProjectsList(data || []);
        }
        fetchProjects();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();
            // console.log(data);
            if (error) {
                console.error(error);
            }
            console.log(data.user?.email);
            setEmail(data.user?.email || null);

            
            }
            fetchUser();
        }, []);

    return (
        <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-6 w-6" />
                    <span>Planwise</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <div className="mb-4 px-2">
                        <Button className="w-full justify-start gap-2" size="sm">
                            <Plus className="h-4 w-4" />
                            New Project
                        </Button>
                    </div>

                    <div className="px-2 py-2">
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Projects
                        </h3>
                        <div className="space-y-1">
                            {projectsList.map((project: Project) => (
                                <Link
                                    key={project.id}
                                    href={`/dashboard/project/${project.id}`}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        project.is_active
                                            ? "bg-muted text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <span className="truncate">{project.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t p-4">
                <div className="mb-4 flex items-center gap-3 pl-2">
                    {/* Simple Avatar Placeholder */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        U
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{email}</span>
                    </div>
                </div>
                <LogoutButton />
            </div>
        </aside>
    );
}
