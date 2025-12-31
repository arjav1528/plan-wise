import { createClient } from "./server";
import { DB_TABLES, type Curriculum } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export async function getCurriculumByProjectId(
  projectId: string
): Promise<{
  data: Curriculum | null;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.CURRICULUMS)
    .select("*")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}

export async function createCurriculum(
  projectId: string,
  topics: Record<string, unknown>
): Promise<{
  data: Curriculum | null;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.CURRICULUMS)
    .insert({
      project_id: projectId,
      topics,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
}

