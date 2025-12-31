"use client";

import { createClient } from "./client";
import { DB_TABLES, type Curriculum } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export interface CreateCurriculumData {
  project_id: string;
  topics: Record<string, unknown>;
}

export async function getCurriculumByProjectId(
  projectId: string
): Promise<{
  data: Curriculum | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
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
  curriculumData: CreateCurriculumData
): Promise<{
  data: Curriculum | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.CURRICULUMS)
    .insert({
      ...curriculumData,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
}

export async function updateCurriculum(
  curriculumId: string,
  topics: Record<string, unknown>
): Promise<{
  data: Curriculum | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.CURRICULUMS)
    .update({ topics })
    .eq("id", curriculumId)
    .select()
    .single();

  return { data, error };
}

