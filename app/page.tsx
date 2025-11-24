// import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getRun } from "workflow/api";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const workflowStatus = getWorkflowStatus();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-12 py-32 px-10 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-lg text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 text-balance">
            Workflows, Webhooks, & Server Actions
          </h1>
          <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400 text-balance">
            When the workflow starts, it begins iterating over a webook. We
            attempt to resume the webhook from a server action, adding a random
            term to the workflow's term list.
          </p>
        </div>

        <Suspense>
          <Dashboard workflowStatusPromise={workflowStatus} />
        </Suspense>
      </main>
    </div>
  );
}

async function getWorkflowStatus() {
  // "use cache: private";
  // cacheLife("seconds");
  // cacheTag("workflow-status");

  const cookieStore = await cookies();
  const runId = cookieStore.get("workflow_run_id")?.value;

  try {
    return runId ? await getRun(runId).status : "not started";
  } catch (_) {
    return "not started";
  }
}
