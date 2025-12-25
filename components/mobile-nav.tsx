"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const projects = [
    { id: "1", title: "Learn Spanish" },
    { id: "2", title: "Marathon Training" },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex items-center border-b p-4 md:hidden">
            <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            <div className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-5 w-5" />
                <span>Planwise</span>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm animate-in fade-in-0" onClick={() => setIsOpen(false)}>
                    <div
                        className="fixed inset-y-0 left-0 z-50 h-full w-3/4 gap-4 border-r bg-background p-6 shadow-lg transition ease-in-out animate-in slide-in-from-left-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setIsOpen(false)}>
                                <BookOpen className="h-6 w-6" />
                                <span>Planwise</span>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button className="w-full justify-start gap-2" size="sm">
                                <Plus className="h-4 w-4" />
                                New Project
                            </Button>
                            <div className="py-2">
                                <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Projects
                                </h3>
                                <div className="space-y-1">
                                    {projects.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/dashboard/project/${project.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                                        >
                                            {project.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
