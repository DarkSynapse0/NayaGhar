import { NextRequest, NextResponse } from "next/server";
import {
  claimNext,
  completeJob,
  failJob,
  reapZombieJobs,
} from "@/lib/jobs/queue";
import { runJob } from "@/lib/jobs/handlers";

export const dynamic = "force-dynamic";

/**
 * Drain up to N jobs per invocation. Hook this to Vercel Cron at 1-minute interval,
 * or call manually during the demo. Auth is a shared secret in X-Cron-Secret.
 */
const MAX_JOBS_PER_RUN = 10;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "bad secret" } },
      { status: 401 }
    );
  }

  await reapZombieJobs();

  const results: { id: string; kind: string; ok: boolean; error?: string }[] = [];
  for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
    const job = await claimNext();
    if (!job) break;
    try {
      await runJob(job.kind, job.payload);
      await completeJob(job.id);
      results.push({ id: job.id, kind: job.kind, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await failJob(job.id, job.attempts, job.maxAttempts, msg);
      results.push({ id: job.id, kind: job.kind, ok: false, error: msg });
    }
  }

  return NextResponse.json({ data: { processed: results.length, results }, error: null });
}

export const GET = POST;
