"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlanResponse, PlanRequest } from "@/lib/types";
import { createTask } from "@/lib/supabase/tasks";
import { createCurriculum } from "@/lib/supabase/curriculum";

interface PlanGeneratorProps {
  projectId: string;
  projectTitle?: string;
  projectDeadline?: string | null;
  projectDailyHours?: number | null;
  onPlanGenerated?: () => void;
}

export function PlanGenerator({
  projectId,
  projectTitle,
  projectDeadline,
  projectDailyHours,
  onPlanGenerated,
}: PlanGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [priorKnowledge, setPriorKnowledge] = useState("");
  const [dailyAvailability, setDailyAvailability] = useState(
    projectDailyHours?.toString() || ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Goal is required");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlan(null);

    try {
      const request: PlanRequest = {
        goal: goal.trim(),
        timeframe: timeframe.trim() || undefined,
        prior_knowledge: priorKnowledge.trim() || undefined,
        daily_availability: dailyAvailability
          ? parseFloat(dailyAvailability)
          : undefined,
        project_metadata: {
          deadline: projectDeadline || undefined,
        },
      };

      const response = await fetch("/api/plan/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const planData: PlanResponse = await response.json();
      setPlan(planData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!plan) return;

    setIsApplying(true);
    setError(null);

    try {
      // Save curriculum
      const { error: curriculumError } = await createCurriculum({
        project_id: projectId,
        topics: plan.curriculum,
      });

      if (curriculumError) {
        console.error("Error saving curriculum:", curriculumError);
      }

      // Create tasks from plan
      for (let i = 0; i < plan.tasks.length; i++) {
        const task = plan.tasks[i];
        // Include tags in description if present
        const description = task.tags.length > 0
          ? `${task.description}\n\nTags: ${task.tags.join(", ")}`
          : task.description;
        
        const { error: taskError } = await createTask({
          project_id: projectId,
          title: task.title,
          description: description,
          estimated_hours: task.estimated_hours,
          status: "pending",
          order_index: i,
        });

        if (taskError) {
          console.error(`Error creating task ${i}:`, taskError);
        }
      }

      setOpen(false);
      setPlan(null);
      setGoal("");
      setTimeframe("");
      setPriorKnowledge("");
      onPlanGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply plan");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Generate Plan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate AI Plan</DialogTitle>
            <DialogDescription>
              Let Planwise create a structured curriculum and tasks for your
              project.
            </DialogDescription>
          </DialogHeader>

          {!plan ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="goal">
                  Goal <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Master Data Structures and Algorithms in 3 months"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={isGenerating}
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeframe">Timeframe (optional)</Label>
                <Input
                  id="timeframe"
                  placeholder="e.g., 3 months, 6 weeks"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priorKnowledge">Prior Knowledge (optional)</Label>
                <Textarea
                  id="priorKnowledge"
                  placeholder="e.g., I already know arrays, strings, and basic recursion"
                  value={priorKnowledge}
                  onChange={(e) => setPriorKnowledge(e.target.value)}
                  disabled={isGenerating}
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dailyAvailability">Daily Availability (hours)</Label>
                <Input
                  id="dailyAvailability"
                  type="number"
                  placeholder="e.g., 2.5"
                  value={dailyAvailability}
                  onChange={(e) => setDailyAvailability(e.target.value)}
                  disabled={isGenerating}
                  min="0"
                  step="0.5"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !goal.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Curriculum Overview</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.curriculum.overview}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Topics ({plan.curriculum.topics.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {plan.curriculum.topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <div className="font-medium">{topic.name}</div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {topic.description}
                      </div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="px-2 py-1 bg-muted rounded">
                          {topic.priority} priority
                        </span>
                        <span className="px-2 py-1 bg-muted rounded">
                          ~{topic.estimated_hours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Tasks ({plan.tasks.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {plan.tasks.map((task, idx) => (
                    <div key={idx} className="p-3 border rounded-lg text-sm">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {task.description}
                      </div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="px-2 py-1 bg-muted rounded">
                          ~{task.estimated_hours}h
                        </span>
                        {task.tags.length > 0 && (
                          <span className="px-2 py-1 bg-muted rounded">
                            {task.tags.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {plan.assumptions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Assumptions</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {plan.assumptions.map((assumption, idx) => (
                      <li key={idx}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPlan(null);
                    setError(null);
                  }}
                  disabled={isApplying}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyPlan}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Apply Plan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

