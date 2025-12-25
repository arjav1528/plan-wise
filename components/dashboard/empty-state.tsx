"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export function EmptyState() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const handleCreateProject = () => {
        setIsCreateDialogOpen(true);
    };

    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight">
                Welcome to Planwise
            </h2>
            <p className="mb-8 max-w-sm text-muted-foreground">
                Create a project to start planning your goals. We'll help you build a
                personalized curriculum and schedule.
            </p>
            <Button size="lg" className="gap-2" onClick={handleCreateProject}>
                <Plus className="h-5 w-5" />
                Create your first project
            </Button>
            <CreateProjectDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onProjectCreated={handleCreateProject}
            />
        </div>
    );
}
