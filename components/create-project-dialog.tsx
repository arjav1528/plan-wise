"use client";

import { useState, useRef, useEffect } from "react";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createProject } from "@/lib/supabase/projects";
import { uploadProjectFiles } from "@/lib/supabase/storage";
import type { FileData } from "@/components/file-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { DatePickerComponent } from "@/components/ui/date-picker";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setGoal("");
      setDescription("");
      setDeadline(null);
      setFiles([]);
    }
  }, [open]);

  // Global paste handler for files when dialog is open
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        const processFiles = async () => {
          const newFiles: FileData[] = [];
          for (const file of pastedFiles) {
            if (file.size > 10 * 1024 * 1024) {
              alert(`File ${file.name} is too large. Maximum size is 10MB.`);
              continue;
            }

            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            newFiles.push({
              dataUrl,
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
              fileSize: file.size,
            });
          }
          if (newFiles.length > 0) {
            setFiles((prev) => [...prev, ...newFiles]);
          }
        };
        processFiles();
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [open]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, error: userError } = await getCurrentUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Upload files to storage if any
      let fileUrls: string[] = [];
      if (files.length > 0) {
        try {
          const fileDataUrls = files.map((f) => f.dataUrl);
          const fileNames = files.map((f) => f.fileName);
          const fileTypes = files.map((f) => f.fileType);
          const fileSizes = files.map((f) => f.fileSize);
          
          fileUrls = await uploadProjectFiles(
            fileDataUrls,
            fileNames,
            fileTypes,
            fileSizes,
            user.id
          );
        } catch (error) {
          console.warn("File upload failed, continuing without files:", error);
        }
      }

      // Prepare project data
      const projectData = {
        user_id: user.id,
        title: goal.trim(),
        description: description.trim() || null,
        is_active: true,
        deadline: deadline ? deadline.toISOString() : null,
        daily_hours: null,
      };

      // Store file URLs
      // Note: If your Project table has a file_urls field, use that instead
      // For now, we'll store as JSON in description or you can add a separate field
      if (fileUrls.length > 0) {
        // Store file URLs as JSON string in description
        // In production, consider adding a file_urls JSONB field to the Project table
        const fileData = JSON.stringify(fileUrls);
        const fileInfo = `\n\n<!-- FILES: ${fileData} -->`;
        projectData.description = (projectData.description || '') + fileInfo;
      }

      const { data: project, error } = await createProject(projectData);

      if (error || !project) {
        throw error || new Error("Failed to create project");
      }

      // Auto-generate plan for the first day
      setIsGeneratingPlan(true);
      try {
        // For the first day, always generate a plan for a single day
        const timeframe = "1 day";

        // Generate plan
        const planRequest = {
          goal: goal.trim(),
          timeframe: timeframe,
          prior_knowledge: description.trim() || undefined,
          project_metadata: {
            deadline: deadline ? deadline.toISOString() : undefined,
          },
        };

        const planResponse = await fetch("/api/plan/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...planRequest,
            project_id: project.id,
          }),
        });

        if (!planResponse.ok) {
          const errorData = await planResponse.json();
          throw new Error(errorData.error || "Failed to generate plan");
        }

        const planData = await planResponse.json();
        
        // Apply plan (save curriculum and create tasks)
        const applyResponse = await fetch("/api/plan/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: project.id,
            plan: planData,
          }),
        });

        if (!applyResponse.ok) {
          const errorData = await applyResponse.json();
          throw new Error(errorData.error || "Failed to apply plan");
        }

        console.log("Plan generated and applied successfully");
      } catch (planError) {
        console.error("Error auto-generating plan:", planError);
        // Show error but don't fail project creation
        alert(`Project created, but plan generation failed: ${planError instanceof Error ? planError.message : "Unknown error"}`);
      } finally {
        setIsGeneratingPlan(false);
      }

      // Reset form
      setGoal("");
      setDescription("");
      setDeadline(null);
      setFiles([]);
      onOpenChange(false);
      
      // Navigate to the project page
      if (project?.id) {
        window.location.href = `/dashboard/project/${project.id}`;
      } else {
        onProjectCreated?.();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project with a goal. A plan will be automatically generated for you.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal">
                Goal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="goal"
                placeholder="e.g., Master Data Structures and Algorithms"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                disabled={isLoading || isGeneratingPlan}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional context or prior knowledge..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || isGeneratingPlan}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <DatePickerComponent
                selected={deadline}
                onChange={(date) => setDeadline(date)}
                placeholder="Pick a date"
                disabled={isLoading || isGeneratingPlan}
                minDate={new Date()}
              />
            </div>

            <FileUpload
              files={files}
              onFilesChange={setFiles}
              disabled={isLoading}
              maxSizeMB={10}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isGeneratingPlan || !goal.trim()}>
              {isGeneratingPlan 
                ? "Generating Plan..." 
                : isLoading 
                ? "Creating..." 
                : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
