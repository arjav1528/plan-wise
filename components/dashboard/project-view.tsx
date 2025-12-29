"use client";

import { CheckCircle2, Clock, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Project, type Task, type PostgrestError } from "@/lib/types";

interface ProjectWorkspaceProps {
    project: Project;
    tasks: Task[];
    tasksError?: PostgrestError | null;
}

// Helper function to format date
function formatDate(dateString: string | null): string {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Helper function to format hours
function formatHours(hours: number | null): string {
    if (!hours) return "No estimate";
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes}m`;
    }
    if (hours === Math.floor(hours)) {
        return `${Math.floor(hours)}h`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
}

// Calculate project status based on deadline and progress
function calculateProjectStatus(project: Project, tasks: Task[]): "on-track" | "behind" | "ahead" {
    if (!project.deadline) return "on-track";
    
    const now = new Date();
    const deadline = new Date(project.deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    // Simple heuristic: if we're more than 50% through time but less than 50% through tasks, we're behind
    const totalDays = Math.ceil((deadline.getTime() - new Date(project.created_at || now).getTime()) / (1000 * 60 * 60 * 24));
    const timeProgress = totalDays > 0 ? (totalDays - daysRemaining) / totalDays : 0;
    
    if (progress < timeProgress - 0.2) return "behind";
    if (progress > timeProgress + 0.2) return "ahead";
    return "on-track";
}

// Get current week days
function getCurrentWeekDays(): Array<{ day: string; date: string; dateObj: Date; active: boolean }> {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Monday as start
    
    const days = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const isToday = date.toDateString() === today.toDateString();
        
        days.push({
            day: dayNames[i],
            date: date.getDate().toString(),
            dateObj: date,
            active: isToday,
        });
    }
    
    return days;
}

export function ProjectWorkspace({ project, tasks, tasksError }: ProjectWorkspaceProps) {
    const projectStatus = calculateProjectStatus(project, tasks);
    const weekDays = getCurrentWeekDays();
    
    // Filter tasks for today (you might want to filter by daily_logs in the future)
    // For now, show all pending and some completed tasks
    const todayTasks = tasks.filter(t => t.status === "pending" || t.status === "completed");
    
    // Sort tasks: pending first, then completed, then by order_index
    const sortedTasks = [...todayTasks].sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        return (a.order_index || 0) - (b.order_index || 0);
    });

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b px-6">
                <div>
                    <h1 className="text-lg font-semibold">{project.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                        {project.deadline && (
                            <>
                                <span className="mx-1">•</span>
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                    projectStatus === "on-track" 
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                        : projectStatus === "behind"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                )}>
                                    {projectStatus === "on-track" ? "On Track" : projectStatus === "behind" ? "Behind" : "Ahead"}
                                </span>
                            </>
                        )}
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
                                <span className="sr-only">Next</span>
                                <span className="h-3 w-3" >{">"}</span>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((d) => (
                            <div
                                key={`${d.day}-${d.date}`}
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

                    {tasksError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            Error loading tasks: {tasksError.message}
                        </div>
                    )}

                    <div className="space-y-3">
                        {sortedTasks.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No tasks yet. Add your first task to get started!
                            </div>
                        ) : (
                            <>
                                {sortedTasks.map((task) => {
                                    const isCompleted = task.status === "completed";
                                    return (
                                        <Card key={task.id} className="transition-all hover:shadow-md group">
                                            <CardContent className="flex items-center p-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "mr-4 h-6 w-6 rounded-full border-2 p-0 hover:bg-transparent",
                                                        isCompleted 
                                                            ? "border-primary text-primary" 
                                                            : "border-muted-foreground text-transparent hover:border-primary"
                                                    )}
                                                >
                                                    <CheckCircle2 className={cn("h-4 w-4", !isCompleted && "opacity-0 group-hover:opacity-20")} />
                                                </Button>
                                                <div className="flex-1">
                                                    <p className={cn("font-medium", isCompleted && "text-muted-foreground line-through")}>
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {formatHours(task.estimated_hours)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                                    + Add another task
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
