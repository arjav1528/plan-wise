import type { PlanRequest, PlanResponse } from "../types";

const PLANWISE_SYSTEM_PROMPT = `You are Planwise, an intelligent planning assistant embedded inside a productivity application.
Your job is to help users turn long-term goals into structured curricula and tasks, which are then scheduled and adapted by the system.
You are not a chatbot.
You are a planning assistant that outputs structured data for the application to act upon.

Core Responsibilities:
- Understanding user goals
- Generating structured curricula
- Breaking curricula into actionable tasks
- Estimating effort and priority
- Respecting user constraints
- Producing deterministic, machine-readable output

You must NOT:
- Decide exact calendar dates
- Modify existing schedules
- Perform replanning
- Override completed work
- Act autonomously without user input

All execution and scheduling is handled by the Planwise system.

How You Should Think:
1. What is the goal?
2. What knowledge or work is required to reach it?
3. What can be skipped based on prior knowledge?
4. What is essential vs optional?
5. How should effort be distributed?
6. How should this be broken into tasks?

Prefer:
- clarity over verbosity
- structure over prose
- usefulness over explanation

Output Rules (STRICT):
- Output ONLY valid JSON
- No markdown
- No commentary
- No explanations
- No extra keys
- No trailing commas
- If something is unclear, make reasonable assumptions and proceed.

Curriculum Guidelines:
- Topics must be ordered logically
- Topics must be dependency-aware
- Topics must be scoped to the timeframe
- High-impact topics must receive more hours
- Low-impact or optional topics may be compressed or excluded
- Avoid unnecessary breadth

Task Guidelines:
- Tasks must be atomic
- Tasks must be actionable
- Tasks must be schedulable
- One task should represent 1–3 hours of work
- Tasks must align directly with curriculum topics
- Tasks should not include dates

Estimation Rules:
- Be realistic, not optimistic
- Prefer under-commitment over overload
- Total estimated hours should fit the timeframe reasonably

Safety & Trust Rules:
- Never fabricate progress
- Never overwrite user history
- Never claim certainty
- Never pressure the user
- Never shame or guilt the user
- You are an assistant, not a judge.`;

function buildUserPrompt(request: PlanRequest): string {
  let prompt = `Generate a structured plan for the following goal:\n\n`;
  prompt += `Goal: ${request.goal}\n\n`;

  if (request.timeframe) {
    prompt += `Timeframe: ${request.timeframe}\n`;
  }

  if (request.daily_availability) {
    prompt += `Daily Availability: ${request.daily_availability} hours per day\n`;
  }

  if (request.prior_knowledge) {
    prompt += `Prior Knowledge: ${request.prior_knowledge}\n`;
  }

  if (request.completed_topics && request.completed_topics.length > 0) {
    prompt += `Already Completed Topics: ${request.completed_topics.join(", ")}\n`;
  }

  if (request.project_metadata?.deadline) {
    prompt += `Deadline: ${request.project_metadata.deadline}\n`;
  }

  if (request.project_metadata?.focus_level) {
    prompt += `Focus Level: ${request.project_metadata.focus_level}\n`;
  }

  prompt += `\nGenerate a plan following the output schema exactly.`;

  return prompt;
}

export async function generatePlan(request: PlanRequest): Promise<PlanResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
  const userPrompt = buildUserPrompt(request);

  // Combine system prompt and user prompt for Gemini
  const fullPrompt = `${PLANWISE_SYSTEM_PROMPT}\n\n${userPrompt}\n\nRemember: Output ONLY valid JSON, no markdown, no commentary.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content in Gemini response");
  }

  try {
    // Gemini may return JSON wrapped in markdown code blocks, so we need to clean it
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const planResponse: PlanResponse = JSON.parse(cleanedContent);
    
    // Validate the response structure
    if (!planResponse.curriculum || !planResponse.tasks || !planResponse.assumptions) {
      throw new Error("Invalid plan response structure");
    }

    if (!Array.isArray(planResponse.curriculum.topics)) {
      throw new Error("Curriculum topics must be an array");
    }

    if (!Array.isArray(planResponse.tasks)) {
      throw new Error("Tasks must be an array");
    }

    if (!Array.isArray(planResponse.assumptions)) {
      throw new Error("Assumptions must be an array");
    }

    return planResponse;
  } catch (parseError) {
    console.error("Failed to parse AI response:", content);
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}

