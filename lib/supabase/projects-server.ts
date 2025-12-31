import { createClient } from "./server";
import { DB_TABLES, type Project } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export async function getProjectById(
  projectId: string
): Promise<{
  data: Project | null;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.PROJECTS)
    .select("*")
    .eq("id", projectId)
    .single();

  return { data, error };
}


