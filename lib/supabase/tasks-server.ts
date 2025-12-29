import { createClient } from "./server";
import { DB_TABLES, type Task } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Get all tasks for a project (server-side)
 */
export async function getTasksByProjectId(
  projectId: string
): Promise<{
  data: Task[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.TASKS)
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return { data, error };
}

