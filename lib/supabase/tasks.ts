"use client";

import { createClient } from "./client";
import { DB_TABLES, type Task } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export interface CreateTaskData {
  project_id: string;
  title: string;
  description?: string | null;
  image_urls?: string[] | null;
  estimated_hours?: number | null;
  status?: "pending" | "completed" | "skipped";
  order_index?: number | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  image_urls?: string[] | null;
  estimated_hours?: number | null;
  status?: "pending" | "completed" | "skipped";
  order_index?: number | null;
}

/**
 * Get all tasks for a project
 */
export async function getTasksByProjectId(
  projectId: string
): Promise<{
  data: Task[] | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.TASKS)
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  taskId: string
): Promise<{
  data: Task | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.TASKS)
    .select("*")
    .eq("id", taskId)
    .single();

  return { data, error };
}

/**
 * Create a new task
 */
export async function createTask(
  taskData: CreateTaskData
): Promise<{
  data: Task | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.TASKS)
    .insert(taskData)
    .select()
    .single();

  return { data, error };
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  updates: UpdateTaskData
): Promise<{
  data: Task | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.TASKS)
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a task
 */
export async function deleteTask(
  taskId: string
): Promise<{
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { error } = await supabase
    .from(DB_TABLES.TASKS)
    .delete()
    .eq("id", taskId);

  return { error };
}

