"use client";

import { createClient } from "./client";
import { DB_TABLES, type Project } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export interface CreateProjectData {
  title: string;
  description?: string | null;
  deadline?: string | null;
  daily_hours?: number | null;
  is_active?: boolean;
  user_id: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  daily_hours?: number | null;
  is_active?: boolean;
}

/**
 * Get all projects for the current user
 */
export async function getProjects(): Promise<{
  data: Project[] | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.PROJECTS)
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Get a single project by ID
 */
export async function getProjectById(
  projectId: string
): Promise<{
  data: Project | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.PROJECTS)
    .select("*")
    .eq("id", projectId)
    .single();

  return { data, error };
}

/**
 * Create a new project
 */
export async function createProject(
  projectData: CreateProjectData
): Promise<{
  data: Project | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.PROJECTS)
    .insert(projectData)
    .select()
    .single();

  return { data, error };
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectData
): Promise<{
  data: Project | null;
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(DB_TABLES.PROJECTS)
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string
): Promise<{
  error: PostgrestError | null;
}> {
  const supabase = createClient();
  const { error } = await supabase
    .from(DB_TABLES.PROJECTS)
    .delete()
    .eq("id", projectId);

  return { error };
}

