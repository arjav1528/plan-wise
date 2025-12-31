

export interface Profile {
  id: string; 
  full_name: string | null;
  created_at: string | null; 
}

export interface Project {
  id: string; 
  user_id: string; 
  title: string;
  description: string | null;
  deadline: string | null; 
  daily_hours: number | null; 
  is_active: boolean | null; 
  created_at: string | null; 
}

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface Task {
  id: string; 
  project_id: string; 
  title: string;
  description: string | null;
  image_urls: string[] | null; 
  estimated_hours: number | null;   
  status: TaskStatus | null; 
  order_index: number | null; 
  created_at: string | null; 
}

export interface DailyLog {
  id: string; 
  project_id: string; 
  log_date: string;     
  completed_task_ids: string[] | null; 
  completed_hours: number | null; 
  notes: string | null;
  created_at: string | null; 
}

export interface Curriculum {
  id: string; 
  project_id: string; 
  topics: Record<string, unknown>; 
  generated_at: string | null; 
}

export type TopicPriority = "high" | "medium" | "low";

export interface CurriculumTopic {
  name: string;
  priority: TopicPriority;
  estimated_hours: number;
  prerequisites: string[];
  description: string;
}

export interface PlanTask {
  title: string;
  description: string;
  estimated_hours: number;
  tags: string[];
}

export interface PlanResponse {
  curriculum: {
    overview: string;
    topics: CurriculumTopic[];
  };
  tasks: PlanTask[];
  assumptions: string[];
}

export interface PlanRequest {
  goal: string;
  timeframe?: string;
  prior_knowledge?: string;
  daily_availability?: number;
  completed_topics?: string[];
  project_metadata?: {
    deadline?: string;
    focus_level?: string;
  };
}

export interface PushSubscription {
  id: string; 
  user_id: string; 
  subscription: Record<string, unknown>; 
  created_at: string | null; 
}

export const DB_TABLES = {
  PROFILES: 'profiles',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  DAILY_LOGS: 'daily_logs',
  CURRICULUMS: 'curriculums',
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',
} as const;

