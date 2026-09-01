import { NextRequest, NextResponse } from "next/server";
import { processKhaltiPidx } from "../callback/route";

export const dynamic = "force-dynamic";

/**
 * Khalti server-to-server webhook. Same handling as the browser redirect,
 * but always responds 200 OK so Khalti doesn't keep retrying. Idempotent
 * because of the providerRef UNIQUE constraint + state check.
 */
export async function POST(req: NextRequest) {
  let body: { pidx?: string };
  try {
    body = (await req.json()) as { pidx?: string };
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!body.pidx) return NextResponse.json({ ok: true });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  await processKhaltiPidx(body.pidx, baseUrl);
  return NextResponse.json({ ok: true });
}
