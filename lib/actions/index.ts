"use server";

// import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { resumeWebhook, start } from "workflow/api";
import { termListWorkflow } from "@/workflows/term-list";

/**
 * Triggers the term list webhook directly with `resumeWebhook`, sending the term to the workflow.
 *
 * Local dev bug:
 * This request is stuck pending and never completes on the client side.
 */
export async function triggerWebhookWithResume(term: string) {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  const request = new Request("http://localhost/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term }),
  });

  try {
    const { terms } = await resumeWebhook(
      `termlist-workflow:${token}`,
      request,
    ).then((r) => r.json());
    return terms;
  } catch (_) {
    throw new Error("Webhook not found");
  }
}

/**
 * Triggers the term list webhook via route handler. Works locally and deployed.
 */
export async function triggerWebhookWithApiRoute(term: string) {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  try {
    const { terms } = await fetch(getWebhookUrl(token), {
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
 *
 * Local dev bug:
 * When starting the dev server from a clean state (no `.next` or `app/.well-known` directory),
 * the first time this is called the workflow starts in a pending state and never changes to running.
 * We also see this error in the dev server logs:
 *
 *    [embedded world] Queue operation failed: TypeError: fetch failed
 *        at ignore-listed frames {
 *      [cause]: AggregateError:
 *          at ignore-listed frames {
 *        code: 'ECONNREFUSED'
 *      }
 *    }
 */
export async function startTermListWorkflow() {
  const token = crypto.randomUUID();

  try {
    const run = await start(termListWorkflow, [token]);

    const cookieStore = await cookies();
    cookieStore.set("workflow_token", token);
    cookieStore.set("workflow_run_id", run.runId);

    // Give it a second to start before updating the cache
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // updateTag("workflow-status");

    return run.runId;
  } catch (_) {
    throw new Error("Failed to start workflow");
  }
}

/**
 * Triggers the term list webhook to stop the workflow. Works locally and deployed.
 */
export async function stopWorkflow() {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }
  try {
    fetch(getWebhookUrl(token), {
      method: "POST",
      body: JSON.stringify({ command: "stop" }),
    });

    // Give it a second to start before updating the cache
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // updateTag("workflow-status");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to trigger webhook via API route");
  }
}

function getWebhookUrl(token: string) {
  const host = process.env.VERCEL_URL || "localhost:3000";
  const protocol = process.env.VERCEL_URL ? "https" : "http";
  console.log(host);
  console.log(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  console.log(process.env.VERCEL_ENV);
  return `${protocol}://${host}/.well-known/workflow/v1/webhook/termlist-workflow%3A${token}`;
}
