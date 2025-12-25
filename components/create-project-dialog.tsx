"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createProject } from "@/lib/supabase/projects";
import { uploadProjectImages } from "@/lib/supabase/storage";
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
import { ImageUpload } from "@/components/image-upload";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [dailyHours, setDailyHours] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setDeadline(undefined);
      setDailyHours("");
      setImages([]);
    }
  }, [open]);

  // Global paste handler for images when dialog is open
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        // Process images similar to ImageUpload component
        const processImages = async () => {
          const newImages: string[] = [];
          for (const file of imageFiles) {
            if (file.size > 5 * 1024 * 1024) {
              alert(`File ${file.name} is too large. Maximum size is 5MB.`);
              continue;
            }

            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            newImages.push(dataUrl);
          }
          if (newImages.length > 0) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        processImages();
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

      // Upload images to storage if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        try {
          imageUrls = await uploadProjectImages(images, user.id);
        } catch (error) {
          console.warn("Image upload failed, continuing without images:", error);
        }
      }

      // Prepare project data
      const projectData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        is_active: true,
        deadline: deadline ? deadline.toISOString() : null,
        daily_hours: dailyHours ? parseFloat(dailyHours) : null,
      };

      // Store image URLs
      // Note: If your Project table has an image_urls field, use that instead
      // For now, we'll store as JSON in description or you can add a separate field
      if (imageUrls.length > 0) {
        // Store image URLs as JSON string in description
        // In production, consider adding an image_urls JSONB field to the Project table
        const imageData = JSON.stringify(imageUrls);
        const imageInfo = `\n\n<!-- IMAGES: ${imageData} -->`;
        projectData.description = (projectData.description || '') + imageInfo;
      }

      const { error } = await createProject(projectData);

      if (error) {
        throw error;
      }

      // Reset form
      setTitle("");
      setDescription("");
      setDeadline(undefined);
      setDailyHours("");
      setImages([]);
      onOpenChange(false);
      onProjectCreated?.();
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
            Create a new project to organize your tasks and track your progress.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="deadline"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={(date) => {
                        setDeadline(date);
                        setDeadlineOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dailyHours">Daily Hours</Label>
                <Input
                  id="dailyHours"
                  type="number"
                  placeholder="e.g., 2.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  disabled={isLoading}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            <ImageUpload
              images={images}
              onImagesChange={setImages}
              disabled={isLoading}
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
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
