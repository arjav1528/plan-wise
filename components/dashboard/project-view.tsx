"use client";

import { Calendar, CheckCircle2, Clock, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data types can be moved to a types file later
interface Task {
    id: string;
    title: string;
    isCompleted: boolean;
    timeEstimate: string;
}

interface Project {
    id: string;
    title: string;
    deadline: string;
    status: "on-track" | "behind" | "ahead";
}

const mockTasks: Task[] = [
    { id: "1", title: "Complete basic vocabulary module", isCompleted: true, timeEstimate: "45m" },
    { id: "2", title: "Practice pronunciation exercises", isCompleted: false, timeEstimate: "30m" },
    { id: "3", title: "Watch Spanish news segment", isCompleted: false, timeEstimate: "15m" },
];

const days = [
    { day: "Mon", date: "12", active: true },
    { day: "Tue", date: "13", active: false },
    { day: "Wed", date: "14", active: false },
    { day: "Thu", date: "15", active: false },
    { day: "Fri", date: "16", active: false },
    { day: "Sat", date: "17", active: false },
    { day: "Sun", date: "18", active: false },
];

export function ProjectWorkspace({ project }: { project?: Project }) {
    // Default fallback if no project provided (though parent should handle this)
    const currentProject = project || {
        id: "1",
        title: "Learn Spanish",
        deadline: "Dec 31, 2025",
        status: "on-track",
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b px-6">
                <div>
                    <h1 className="text-lg font-semibold">{currentProject.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Deadline: {currentProject.deadline}</span>
                        <span className="mx-1">•</span>
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            currentProject.status === "on-track" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700"
                        )}>
                            On Track
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Edit Plan</Button>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
                {/* Calendar Preview */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-tight">This Week</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6">
                                <span className="sr-only">Previous</span>
                                <span className="h-3 w-3" >{"<"}</span>
                            </Button>
                            <Button variant="outline" size="icon" className="h-6 w-6">
                                <span className="sr-only">Previous</span>
                                <span className="h-3 w-3" >{">"}</span>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((d) => (
                            <div
                                key={d.day}
                                className={cn(
                                    "flex flex-col items-center justify-center rounded-lg border bg-card py-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                    d.active && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                )}
                            >
                                <span className="text-xs opacity-70 mb-1">{d.day}</span>
                                <span className="font-bold">{d.date}</span>
                                {d.active && <div className="mt-1 h-1 w-1 rounded-full bg-white" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Today's Tasks */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-tight">Today's Focus</h2>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground">
                            <Plus className="h-3 w-3" />
                            Add Task
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {mockTasks.map((task) => (
                            <Card key={task.id} className="transition-all hover:shadow-md group">
                                <CardContent className="flex items-center p-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "mr-4 h-6 w-6 rounded-full border-2 p-0 hover:bg-transparent",
                                            task.isCompleted ? "border-primary text-primary" : "border-muted-foreground text-transparent hover:border-primary"
                                        )}
                                    >
                                        <CheckCircle2 className={cn("h-4 w-4", !task.isCompleted && "opacity-0 group-hover:opacity-20")} />
                                    </Button>
                                    <div className="flex-1">
                                        <p className={cn("font-medium", task.isCompleted && "text-muted-foreground line-through")}>
                                            {task.title}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {task.timeEstimate}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                            + Add another task
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
