import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/planner";
import type { PlanRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getCompletedTasksByProjectId } from "@/lib/supabase/tasks-server";

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
    const planRequest: PlanRequest = {
      goal: body.goal,
      timeframe: body.timeframe,
      prior_knowledge: body.prior_knowledge,
      daily_availability: body.daily_availability,
      completed_topics: body.completed_topics,
      project_metadata: body.project_metadata,
    };

    if (!planRequest.goal || planRequest.goal.trim().length === 0) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      );
    }

    let completedTasks: Array<{ title: string; description: string | null }> = [];
    if (body.project_id) {
      const { data: tasks, error: tasksError } = await getCompletedTasksByProjectId(body.project_id);
      if (tasksError) {
        console.error("Error fetching completed tasks:", tasksError);
      } else if (tasks && tasks.length > 0) {
        completedTasks = tasks.map(task => ({
          title: task.title,
          description: task.description,
        }));
      }
    }

    const plan = await generatePlan(planRequest, completedTasks);

    if (body.project_id) {
      const supabase = await createClient();
      const { error: curriculumError } = await supabase
        .from("curriculums")
        .insert({
          project_id: body.project_id,
          topics: plan.curriculum,
          generated_at: new Date().toISOString(),
        });

      if (curriculumError) {
        console.error("Error saving curriculum:", curriculumError);
      }
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate plan" 
      },
      { status: 500 }
    );
  }
}

