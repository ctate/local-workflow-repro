"use client";

import { use, useState, useTransition } from "react";
import {
  startTermListWorkflow,
  stopWorkflow,
  triggerWebhookWithApiRoute,
  triggerWebhookWithResume,
} from "@/lib/actions";
import { getRandomTerm } from "@/lib/utils";
import { Spinner } from "./spinner";

export function Dashboard({
  workflowStatusPromise,
}: {
  workflowStatusPromise: Promise<string>;
}) {
  const workflowStatus = use(workflowStatusPromise);
  const [terms, setTerms] = useState<string[]>([]);
  const [isStartPending, startStartTransition] = useTransition();
  const [isResumePending, startResumeTransition] = useTransition();
  const [isApiRoutePending, startApiRouteTransition] = useTransition();

  async function startWorkflow() {
    startStartTransition(async () => {
      await startTermListWorkflow();
    });
  }

  async function addTermWithResume() {
    startResumeTransition(async () => {
      const term = await getRandomTerm();
      const result = await triggerWebhookWithResume(term);
      setTerms(result);
    });
  }

  async function addTermWithApiRoute() {
    startApiRouteTransition(async () => {
      const term = await getRandomTerm();
      const result = await triggerWebhookWithApiRoute(term);
      setTerms(result);
    });
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return "text-green-600 dark:text-green-500";
      case "pending":
        return "text-zinc-600 dark:text-zinc-500";
      case "failed":
        return "text-red-600 dark:text-red-500";
      case "cancelled":
        return "text-yellow-600 dark:text-yellow-500";
      case "completed":
        return "text-blue-600 dark:text-blue-500";
      default:
        return "text-zinc-600 dark:text-zinc-500";
    }
  };

  return (
    <div className="flex flex-col gap-8 text-base font-medium">
      <div className="flex justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-500">
          Workflow status:{" "}
          <span className={getStatusColor(workflowStatus)}>
            {workflowStatus}
          </span>
        </p>
        {workflowStatus === "running" && (
          <button
            className="text-xs text-red-600 dark:text-red-500 hover:opacity-80 cursor-pointer"
            type="button"
            onClick={stopWorkflow}
          >
            [ stop workflow ]
          </button>
        )}
      </div>

      {["not started", "cancelled", "completed", "failed", "pending"].includes(
        workflowStatus,
      ) ? (
        <button
          className={`relative flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-background md:w-[158px] text-sm cursor-pointer ${!isStartPending ? "hover:bg-[#383838] dark:hover:bg-[#ccc]" : ""}`}
          type="button"
          onClick={startWorkflow}
          disabled={isStartPending}
        >
          <span className={isStartPending ? "opacity-0" : "opacity-100"}>
            Start Workflow
          </span>
          {isStartPending && (
            <Spinner className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
          )}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            className={`relative flex h-12 w-auto items-center justify-center rounded-sm border border-solid border-black/8 px-5 dark:border-white/[.145] text-sm cursor-pointer whitespace-nowrap ${!isResumePending ? "hover:border-transparent hover:bg-black/4 dark:hover:bg-[#1a1a1a]" : ""}`}
            type="button"
            onClick={addTermWithResume}
            disabled={isResumePending}
          >
            <span className={isResumePending ? "opacity-0" : "opacity-100"}>
              Add Term (resume webhook)
            </span>
            {isResumePending && (
              <Spinner className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
            )}
          </button>
          <button
            className={`relative flex h-12 w-auto items-center justify-center rounded-sm border border-solid border-black/8 px-5 dark:border-white/[.145] text-sm cursor-pointer ${!isApiRoutePending ? "hover:border-transparent hover:bg-black/4 dark:hover:bg-[#1a1a1a]" : ""}`}
            type="button"
            onClick={addTermWithApiRoute}
            disabled={isApiRoutePending}
          >
            <span className={isApiRoutePending ? "opacity-0" : "opacity-100"}>
              Add Term (webhook url)
            </span>
            {isApiRoutePending && (
              <Spinner className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
            )}
          </button>
        </div>
      )}

      {terms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {terms.map((term) => (
            <div
              key={term}
              className="bg-zinc-100 dark:bg-zinc-800 py-1 px-2 text-xs rounded-xs"
            >
              {term}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
