import { createWebhook, type RequestWithResponse } from "workflow";

/**
 * This workflow iterates over a webhook. Calling the webhook adds a
 * term to the list and responds with the updated list.
 */
export async function termListWorkflow(token: string) {
  "use workflow";

  const webhook = createWebhook({
    token: `termlist-workflow:${token}`,
  });

  console.log("webhook", webhook.url);

  const terms = [];

  for await (const request of webhook) {
    const data = await request.json();
    const { term, command } = data;

    if (command === "stop") {
      break;
    }

    if (term) {
      terms.push(term);
    }

    console.log("[Workflow] Terms", terms);

    // await respondWithTerms(request, terms);
  }

  return terms;
}

// async function respondWithTerms(request: RequestWithResponse, terms: string[]) {
//   "use step";

//   await request.respondWith(
//     new Response(JSON.stringify({ terms }), {
//       headers: { "Content-Type": "application/json" },
//     }),
//   );

//   console.log("[Workflow] Responded with terms", terms);
// }
