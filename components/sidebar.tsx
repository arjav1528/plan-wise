"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Settings, LogOut, LayoutGrid, Map, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { getProjects } from "@/lib/supabase/projects";
import { getUserEmail } from "@/lib/supabase/auth";



export function Sidebar() {

    
    const pathname = usePathname();
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const [email, setEmail] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isLoadingEmail, setIsLoadingEmail] = useState(true);



    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        const { data, error } = await getProjects();
        if (error) {
            console.error(error);
        }
        setProjectsList(data || []);
        setIsLoadingProjects(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoadingEmail(true);
            const userEmail = await getUserEmail();
            setEmail(userEmail);
            setIsLoadingEmail(false);
        };
        fetchUser();
    }, []);

    return (
        <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-6 w-6" />
                    <span>Planwise</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <div className="mb-4 px-2">
                        <Button 
                            className="w-full justify-start gap-2" 
                            size="sm"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            New Project
                        </Button>
                    </div>

                    <div className="px-2 py-2">
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Projects
                        </h3>
                        <div className="space-y-1">
                            {isLoadingProjects ? (
                                // Loading skeleton for projects
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2"
                                    >
                                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                    </div>
                                ))
                            ) : projectsList.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                    No projects yet
                                </div>
                            ) : (
                                projectsList.map((project: Project) => (
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
                                ))
                            )}
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
                    <div className="flex flex-col flex-1 min-w-0">
                        {isLoadingEmail ? (
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                            <span className="text-xs text-muted-foreground truncate">{email || "Loading..."}</span>
                        )}
                    </div>
                </div>
                <LogoutButton />
            </div>
            <CreateProjectDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onProjectCreated={fetchProjects}
            />
        </aside>
    );
}
