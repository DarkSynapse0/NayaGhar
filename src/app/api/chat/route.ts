import { NextRequest, NextResponse } from "next/server";

// Proxies chat messages to the n8n "Ghar Khoji" workflow webhook.
// Keeping this server-side avoids CORS and hides the webhook URL from the client.
// Set N8N_CHAT_WEBHOOK_URL in .env.local, e.g.
//   N8N_CHAT_WEBHOOK_URL=http://localhost:5678/webhook/nayaghar-chat
const WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { reply: "Chat is not configured yet." },
      { status: 500 }
    );
  }

  try {
    const { message, sessionId } = await request.json();

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { reply: "Please type a message." },
        { status: 400 }
      );
    }

    // Forward to n8n. The workflow replies with { reply: "..." }.
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.slice(0, 500),
        sessionId: typeof sessionId === "string" ? sessionId : "anon",
      }),
      // Housing search can take a few seconds; give the agent room to run.
      signal: AbortSignal.timeout(30_000),
    });

    // Read the raw body first so we can handle empty / non-JSON responses
    // (an empty body usually means the n8n execution failed — check Executions).
    const raw = (await res.text()).trim();

    if (!res.ok) {
      console.error(`n8n responded ${res.status}: ${raw.slice(0, 300)}`);
      return NextResponse.json(
        {
          reply:
            res.status === 404
              ? "Chatbot workflow is not active in n8n. Activate it and try again."
              : "The assistant is having trouble right now. Please try again.",
        },
        { status: 502 }
      );
    }

    if (!raw) {
      // 200 but empty = workflow ran but didn't reach the Respond node
      // (usually a failed node inside n8n, e.g. missing Gemini credential).
      console.error("n8n returned an empty body — check the workflow Executions tab.");
      return NextResponse.json(
        {
          reply:
            "The assistant didn't return a reply. Check the n8n workflow execution (model node + active).",
        },
        { status: 502 }
      );
    }

    let reply: string;
    try {
      const data = JSON.parse(raw);
      reply = typeof data?.reply === "string" ? data.reply : raw;
    } catch {
      // n8n returned plain text instead of JSON — use it as-is.
      reply = raw;
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return NextResponse.json(
      { reply: "Sorry, something went wrong. Please try again in a moment." },
      { status: 502 }
    );
  }
}
