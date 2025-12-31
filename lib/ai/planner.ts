import type { PlanRequest, PlanResponse } from "../types";

const PLANWISE_SYSTEM_PROMPT = `You are Planwise, an intelligent daily planning assistant embedded inside a productivity application.
Your job is to generate TODAY'S plan only - a focused set of tasks for the current day that moves the user toward their goal.
You are not a chatbot.
You are a daily planning assistant that outputs structured data for the application to act upon.

Core Responsibilities:
- Understanding the user's long-term goal
- Generating TODAY'S tasks only (not a full curriculum)
- Breaking down today's work into actionable tasks
- Estimating effort for today's work
- Respecting user constraints (time available, deadlines)
- Avoiding repetition of already completed tasks
- Producing deterministic, machine-readable output

You must NOT:
- Generate tasks for future days
- Repeat tasks that have already been completed
- Decide exact calendar dates (beyond "today")
- Modify existing schedules
- Override completed work
- Act autonomously without user input

All execution and scheduling is handled by the Planwise system.

How You Should Think:
1. What is the long-term goal?
2. What has already been completed? (DO NOT repeat these)
3. What is the next logical step toward the goal?
4. What can be accomplished TODAY given available time?
5. How should today's work be broken into tasks?
6. What dependencies exist for today's tasks?

Prefer:
- clarity over verbosity
- structure over prose
- usefulness over explanation
- focus on today over long-term planning

Output Rules (STRICT):
- Output ONLY valid JSON
- No markdown
- No commentary
- No explanations
- No extra keys
- No trailing commas
- If something is unclear, make reasonable assumptions and proceed.

Daily Planning Guidelines:
- Generate tasks ONLY for TODAY
- Total estimated hours should fit within the user's daily availability
- Tasks should be the next logical steps toward the goal
- Tasks should build on what's already been completed
- DO NOT include tasks that have already been completed (they will be listed in the prompt)
- Focus on high-impact work that moves the goal forward

Task Guidelines:
- Tasks must be atomic and actionable
- One task should represent 1–3 hours of work
- Tasks should be specific and clear
- Tasks should align with the overall goal
- Tasks should not include dates (they're for today by default)

Estimation Rules:
- Be realistic, not optimistic
- Prefer under-commitment over overload
- Total estimated hours should fit the daily availability
- Account for breaks and context switching

Safety & Trust Rules:
- Never fabricate progress
- Never overwrite user history
- Never claim certainty
- Never pressure the user
- Never shame or guilt the user
- Never repeat completed tasks
- You are an assistant, not a judge.`;

function buildUserPrompt(request: PlanRequest, completedTasks: Array<{ title: string; description: string | null }> = []): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  let prompt = `Generate TODAY'S plan (${today}) for the following goal:\n\n`;
  prompt += `Goal: ${request.goal}\n\n`;

  if (completedTasks.length > 0) {
    const taskTitles = completedTasks.map(task => task.title).join(', ');
    prompt += `CRITICAL: These ${completedTasks.length} tasks are already completed. DO NOT create any task with a similar or identical title: ${taskTitles}\n\n`;
  } else {
    prompt += `Note: No tasks have been completed yet. This appears to be the first day of planning.\n\n`;
  }

  if (request.daily_availability) {
    prompt += `Available Time Today: ${request.daily_availability} hours\n`;
  } else {
    prompt += `Available Time Today: Please estimate based on a typical work day\n`;
  }

  if (request.prior_knowledge) {
    prompt += `Prior Knowledge: ${request.prior_knowledge}\n`;
  }

  if (request.project_metadata?.deadline) {
    const deadlineDate = new Date(request.project_metadata.deadline);
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    prompt += `Deadline: ${request.project_metadata.deadline} (${daysUntilDeadline} days from today)\n`;
  }

  if (request.project_metadata?.focus_level) {
    prompt += `Focus Level: ${request.project_metadata.focus_level}\n`;
  }

  prompt += `\nGenerate TODAY'S plan only. Focus on what can be accomplished today to move toward the goal. Do not repeat completed tasks.`;

  return prompt;
}

export async function generatePlan(
  request: PlanRequest,
  completedTasks: Array<{ title: string; description: string | null }> = []
): Promise<PlanResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GEMINI_API environment variable is not set");
  }

  const trimmedApiKey = apiKey.trim();
  if (!trimmedApiKey) {
    throw new Error("GEMINI_API_KEY is empty");
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const userPrompt = buildUserPrompt(request, completedTasks);

  const jsonSchema = `\n\nRequired JSON Output Format (for TODAY'S plan only):
{
  "curriculum": {
    "overview": "Brief overview of today's focus and how it relates to the overall goal",
    "topics": [
      {
        "name": "Topic/area to focus on today",
        "priority": "high" | "medium" | "low",
        "estimated_hours": number,
        "prerequisites": [],
        "description": "What this topic covers for today"
      }
    ]
  },
  "tasks": [
    {
      "title": "Task title for today",
      "description": "Task description - what needs to be done",
      "estimated_hours": number (should total to available time),
      "tags": ["tag1", "tag2"]
    }
  ],
  "assumptions": ["assumption1", "assumption2"]
}

IMPORTANT: 
- Generate tasks ONLY for TODAY
- Total estimated_hours should match or be less than daily availability
- Do NOT repeat any completed tasks
- Focus on the next logical steps toward the goal`;

  const fullPrompt = `${PLANWISE_SYSTEM_PROMPT}${jsonSchema}\n\n${userPrompt}\n\nRemember: Output ONLY valid JSON matching the schema above, no markdown, no commentary, no extra fields. Generate TODAY'S plan only.`;

  const modelNameVariations = new Set([
    modelName,
    `${modelName}-latest`,
    `${modelName}-001`,
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-thinking-exp-001",
  ]);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: fullPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  let lastError: Error | null = null;

  const apiVersions = ["v1beta", "v1"];
  
  for (const apiVersion of apiVersions) {
    for (const tryModelName of modelNameVariations) {
      const encodedApiKey = encodeURIComponent(trimmedApiKey);
      const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${tryModelName}:generateContent?key=${encodedApiKey}`;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorText = "";
          let errorMessage = "";
          try {
            errorText = await response.text();
            const errorJson = JSON.parse(errorText);
            console.error(`Gemini API error for ${apiVersion}/${tryModelName}:`, JSON.stringify(errorJson, null, 2));
          
          const apiError = errorJson.error || errorJson;
          errorMessage = apiError.message || apiError.status || errorText;
          
          if (errorMessage.includes("pattern") || errorMessage.includes("invalid") || errorMessage.includes("format")) {
            errorMessage = `API validation error: ${errorMessage}. Please check your GEMINI_API_KEY format and model name.`;
          }
          
            lastError = new Error(`Gemini API request failed: ${response.status} ${response.statusText}. ${errorMessage}`);
          } catch (parseError) {
            console.error(`Gemini API error response (raw) for ${apiVersion}/${tryModelName}:`, errorText);
            errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`;
            lastError = new Error(`Gemini API request failed: ${response.status} ${response.statusText}. ${errorMessage}`);
          }
          
          if (response.status === 404) {
            continue;
          }
          
          if (response.status === 400) {
            console.warn(`Bad request for ${apiVersion}/${tryModelName}, trying next variation...`);
            continue;
          }
          
          throw lastError;
        }

        const data = await response.json();

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          throw new Error("No content in Gemini response");
        }

        try {
          let cleanedContent = content.trim();
          
          if (cleanedContent.startsWith("```json")) {
            cleanedContent = cleanedContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          } else if (cleanedContent.startsWith("```")) {
            cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }

          const planResponse: PlanResponse = JSON.parse(cleanedContent);
          
          console.log("Parsed plan response structure:", {
            hasCurriculum: !!planResponse.curriculum,
            hasTasks: !!planResponse.tasks,
            hasAssumptions: !!planResponse.assumptions,
            curriculumKeys: planResponse.curriculum ? Object.keys(planResponse.curriculum) : [],
            tasksType: Array.isArray(planResponse.tasks),
            assumptionsType: Array.isArray(planResponse.assumptions),
          });
          
          if (!planResponse.curriculum) {
            console.error("Missing curriculum in response. Response keys:", Object.keys(planResponse));
            throw new Error("Invalid plan response structure: missing 'curriculum' field");
          }

          if (!planResponse.tasks) {
            console.error("Missing tasks in response. Response keys:", Object.keys(planResponse));
            throw new Error("Invalid plan response structure: missing 'tasks' field");
          }

          if (!planResponse.assumptions) {
            console.error("Missing assumptions in response. Response keys:", Object.keys(planResponse));
            throw new Error("Invalid plan response structure: missing 'assumptions' field");
          }

          if (typeof planResponse.curriculum !== "object") {
            throw new Error("Invalid plan response structure: 'curriculum' must be an object");
          }

          if (!planResponse.curriculum.topics) {
            console.error("Missing topics in curriculum. Curriculum keys:", Object.keys(planResponse.curriculum));
            throw new Error("Invalid plan response structure: missing 'curriculum.topics' field");
          }

          if (!Array.isArray(planResponse.curriculum.topics)) {
            throw new Error(`Invalid plan response structure: 'curriculum.topics' must be an array, got ${typeof planResponse.curriculum.topics}`);
          }

          if (!Array.isArray(planResponse.tasks)) {
            throw new Error(`Invalid plan response structure: 'tasks' must be an array, got ${typeof planResponse.tasks}`);
          }

          if (!Array.isArray(planResponse.assumptions)) {
            throw new Error(`Invalid plan response structure: 'assumptions' must be an array, got ${typeof planResponse.assumptions}`);
          }

          if (!planResponse.curriculum.overview) {
            planResponse.curriculum.overview = "Generated curriculum for the specified goal";
          }

          return planResponse;
        } catch (parseError) {
          console.error("Failed to parse AI response. Raw content:", content);
          console.error("Parse error:", parseError);
          throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
        }
      } catch (error) {
        if (error instanceof Error && !error.message.includes("404")) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error("Unknown error");
        continue;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("All model name variations failed. Please check your GEMINI_API_KEY and model name.");
}

