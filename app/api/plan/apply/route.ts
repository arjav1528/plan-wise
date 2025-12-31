import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import type { PlanResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { project_id, plan } = body as { project_id: string; plan: PlanResponse };

    if (!project_id || !plan) {
      return NextResponse.json(
        { error: "project_id and plan are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error: curriculumError } = await supabase
      .from("curriculums")
      .insert({
        project_id,
        topics: plan.curriculum,
        generated_at: new Date().toISOString(),
      });

    if (curriculumError) {
      console.error("Error saving curriculum:", curriculumError);
    }

    const tasks = plan.tasks.map((task, index) => ({
      project_id,
      title: task.title,
      description: task.tags.length > 0
        ? `${task.description}\n\nTags: ${task.tags.join(", ")}`
        : task.description,
      estimated_hours: task.estimated_hours,
      status: "pending" as const,
      order_index: index,
    }));

    const { error: tasksError } = await supabase
      .from("tasks")
      .insert(tasks);

    if (tasksError) {
      console.error("Error creating tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to create tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error applying plan:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to apply plan" 
      },
      { status: 500 }
    );
  }
}

