"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { resumeWebhook, start } from "workflow/api";
import { termListWorkflow } from "@/workflows/term-list";

/**
 * Triggers the term list webhook directly.
 */
export async function triggerWebhookWithResume(term: string) {
  try {
    const res = await sendWebhookTrigger<{ terms: string[] }>({ term });
    console.log("res", res);
    return [];
  } catch (_) {
    throw new Error("Webhook not found");
  }
}

/**
 * Triggers the term list webhook via route handler.
 *
 * Does not work when deployed, since webhook url points to the
 * deployment url, which is protected.
 */
export async function triggerWebhookWithApiRoute(term: string) {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  const vercelUrl = process.env.VERCEL_URL;
  const host = vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
  const webhookUrl = `${host}/.well-known/workflow/v1/webhook/termlist-workflow%3A${token}`;

  try {
    const { terms } = await fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify({ term }),
    }).then((r) => r.json());

    return terms;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to trigger webhook via API route");
  }
}

/**
 * Starts the term list workflow and updates the cache with the workflow status.
 */
export async function startTermListWorkflow() {
  try {
    const token = crypto.randomUUID();
    const run = await start(termListWorkflow, [token]);

    const cookieStore = await cookies();
    cookieStore.set("workflow_token", token);
    cookieStore.set("workflow_run_id", run.runId);

    // Give it a second to start before updating the cache
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateTag("workflow-status");

    return run.runId;
  } catch (_) {
    throw new Error("Failed to start workflow");
  }
}

/**
 * Triggers the term list webhook to stop the workflow.
 */
export async function stopWorkflow() {
  try {
    sendWebhookTrigger({ command: "stop" });

    // Give it a second to start before updating the cache
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateTag("workflow-status");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to stop workflow",
    );
  }
}

async function sendWebhookTrigger<T = Record<string, unknown>>({
  command,
  term,
}: {
  command?: string;
  term?: string;
}): Promise<T> {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  const request = new Request("http://localhost/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, term }),
  });

  return resumeWebhook(`termlist-workflow:${token}`, request).then(
    async (r) => {
      const contentType = r.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return r.json() as Promise<T>;
      }
      return r.text() as Promise<T>;
    },
  );
}
