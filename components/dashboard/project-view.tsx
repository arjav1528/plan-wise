"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, MoreHorizontal, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Project, type Task, type PostgrestError, type Curriculum, type PlanResponse } from "@/lib/types";
import { createTask, updateTask, deleteTask, getTasksByProjectId } from "@/lib/supabase/tasks";
import { updateProject } from "@/lib/supabase/projects";

interface ProjectWorkspaceProps {
    project: Project;
    tasks: Task[];
    tasksError?: PostgrestError | null;
    curriculum?: Curriculum | null;
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

export function ProjectWorkspace({ project: initialProject, tasks: initialTasks, tasksError, curriculum }: ProjectWorkspaceProps) {
    const router = useRouter();
    const [project, setProject] = useState<Project>(initialProject);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingProject, setIsUpdatingProject] = useState(false);
    const [createTaskForm, setCreateTaskForm] = useState({
        title: "",
        estimated_hours: "",
        status: "pending" as "pending" | "completed" | "skipped",
    });
    const [editProjectForm, setEditProjectForm] = useState({
        title: initialProject.title,
        description: initialProject.description || "",
        deadline: initialProject.deadline ? new Date(initialProject.deadline).toISOString().split('T')[0] : "",
        daily_hours: initialProject.daily_hours?.toString() || "",
    });

    // Update form when project changes
    useEffect(() => {
        setEditProjectForm({
            title: project.title,
            description: project.description || "",
            deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : "",
            daily_hours: project.daily_hours?.toString() || "",
        });
    }, [project]);

    const projectStatus = calculateProjectStatus(project, tasks);
    const weekDays = getCurrentWeekDays();
    
    // Refresh tasks from the database
    const refreshTasks = async () => {
        const { data, error } = await getTasksByProjectId(project.id);
        if (!error && data) {
            setTasks(data);
        }
    };

    // Refresh tasks on mount and when project changes
    useEffect(() => {
        refreshTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.id]);

    // Handle create task
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const taskData = {
            project_id: project.id,
            title: createTaskForm.title,
            estimated_hours: createTaskForm.estimated_hours ? parseFloat(createTaskForm.estimated_hours) : null,
            status: createTaskForm.status,
        };

        const { error } = await createTask(taskData);
        
        if (!error) {
            setIsCreateDialogOpen(false);
            setCreateTaskForm({ title: "", estimated_hours: "", status: "pending" });
            await refreshTasks();
        } else {
            console.error("Error creating task:", error);
            alert("Failed to create task: " + error.message);
        }
        
        setIsLoading(false);
    };

    // Handle update task status
    const handleUpdateTaskStatus = async (taskId: string, currentStatus: string | null) => {
        const newStatus = currentStatus === "completed" ? "pending" : "completed";
        
        const { error } = await updateTask(taskId, { status: newStatus });
        
        if (!error) {
            await refreshTasks();
        } else {
            console.error("Error updating task:", error);
            alert("Failed to update task: " + error.message);
        }
    };

    // Handle delete task
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) {
            return;
        }

        const { error } = await deleteTask(taskId);
        
        if (!error) {
            await refreshTasks();
        } else {
            console.error("Error deleting task:", error);
            alert("Failed to delete task: " + error.message);
        }
    };

    // Handle update project
    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProject(true);
        
        const updateData = {
            title: editProjectForm.title,
            description: editProjectForm.description || null,
            deadline: editProjectForm.deadline ? editProjectForm.deadline : null,
            daily_hours: editProjectForm.daily_hours ? parseFloat(editProjectForm.daily_hours) : null,
        };

        const { data, error } = await updateProject(project.id, updateData);
        
        if (!error && data) {
            setProject(data);
            setIsEditDialogOpen(false);
            router.refresh(); // Refresh server component data
        } else {
            console.error("Error updating project:", error);
            alert("Failed to update project: " + (error?.message || "Unknown error"));
        }
        
        setIsUpdatingProject(false);
    };
    
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
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Edit Plan</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <form onSubmit={handleUpdateProject}>
                                <DialogHeader>
                                    <DialogTitle>Edit Project</DialogTitle>
                                    <DialogDescription>
                                        Update your project details. Make changes to the fields below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="project-title">Title *</Label>
                                        <Input
                                            id="project-title"
                                            placeholder="Enter project title"
                                            value={editProjectForm.title}
                                            onChange={(e) => setEditProjectForm({ ...editProjectForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="project-description">Description</Label>
                                        <Textarea
                                            id="project-description"
                                            placeholder="Enter project description"
                                            value={editProjectForm.description}
                                            onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="project-deadline">Deadline</Label>
                                            <Input
                                                id="project-deadline"
                                                type="date"
                                                value={editProjectForm.deadline}
                                                onChange={(e) => setEditProjectForm({ ...editProjectForm, deadline: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="project-daily-hours">Daily Hours</Label>
                                            <Input
                                                id="project-daily-hours"
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max="24"
                                                placeholder="e.g., 8"
                                                value={editProjectForm.daily_hours}
                                                onChange={(e) => setEditProjectForm({ ...editProjectForm, daily_hours: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isUpdatingProject}>
                                        {isUpdatingProject ? "Updating..." : "Update Project"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
                {/* Today's Plan - Curriculum */}
                {curriculum && curriculum.topics && (
                    <div className="mb-8">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <CardTitle>Today's Plan</CardTitle>
                                </div>
                                {curriculum.generated_at && (
                                    <CardDescription>
                                        Generated on {new Date(curriculum.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    try {
                                        const curriculumData = curriculum.topics as PlanResponse["curriculum"];
                                        return (
                                            <div className="space-y-4">
                                                {curriculumData.overview && (
                                                    <div className="space-y-2">
                                                        <h3 className="text-sm font-semibold">Overview</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {curriculumData.overview}
                                                        </p>
                                                    </div>
                                                )}
                                                {curriculumData.topics && curriculumData.topics.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h3 className="text-sm font-semibold">
                                                            Topics ({curriculumData.topics.length})
                                                        </h3>
                                                        <div className="grid gap-3">
                                                            {curriculumData.topics.map((topic, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="p-3 border rounded-lg text-sm"
                                                                >
                                                                    <div className="font-medium">{topic.name}</div>
                                                                    <div className="text-muted-foreground text-xs mt-1">
                                                                        {topic.description}
                                                                    </div>
                                                                    <div className="flex gap-2 mt-2 text-xs">
                                                                        <span className={cn(
                                                                            "px-2 py-1 rounded",
                                                                            topic.priority === "high"
                                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                                : topic.priority === "medium"
                                                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                                        )}>
                                                                            {topic.priority} priority
                                                                        </span>
                                                                        <span className="px-2 py-1 bg-muted rounded">
                                                                            ~{topic.estimated_hours}h
                                                                        </span>
                                                                        {topic.prerequisites && topic.prerequisites.length > 0 && (
                                                                            <span className="px-2 py-1 bg-muted rounded">
                                                                                Requires: {topic.prerequisites.join(", ")}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    } catch (error) {
                                        console.error("Error parsing curriculum:", error);
                                        return (
                                            <p className="text-sm text-muted-foreground">
                                                Unable to display curriculum. Please check the data format.
                                            </p>
                                        );
                                    }
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                )}

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
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground">
                                    <Plus className="h-3 w-3" />
                                    Add Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleCreateTask}>
                                    <DialogHeader>
                                        <DialogTitle>Create New Task</DialogTitle>
                                        <DialogDescription>
                                            Add a new task to your project. Fill in the details below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Title *</Label>
                                            <Input
                                                id="title"
                                                placeholder="Enter task title"
                                                value={createTaskForm.title}
                                                onChange={(e) => setCreateTaskForm({ ...createTaskForm, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="estimated_hours">Estimated Hours</Label>
                                            <Input
                                                id="estimated_hours"
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                placeholder="e.g., 2.5"
                                                value={createTaskForm.estimated_hours}
                                                onChange={(e) => setCreateTaskForm({ ...createTaskForm, estimated_hours: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="status">Status</Label>
                                            <select
                                                id="status"
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={createTaskForm.status}
                                                onChange={(e) => setCreateTaskForm({ ...createTaskForm, status: e.target.value as "pending" | "completed" | "skipped" })}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="completed">Completed</option>
                                                <option value="skipped">Skipped</option>
                                            </select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Creating..." : "Create Task"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
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
                                                    onClick={() => handleUpdateTaskStatus(task.id, task.status)}
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
                                                        {task.status && (
                                                            <>
                                                                <span className="mx-1">•</span>
                                                                <span className={cn(
                                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                                    task.status === "completed"
                                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                        : task.status === "skipped"
                                                                        ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                                                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                )}>
                                                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                <div 
                                    className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                >
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
