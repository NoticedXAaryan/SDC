import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Owner provisioning is intentionally unavailable over HTTP.
 *
 * Owners are provisioned by an operator using `npm run db:set-owner`. Keeping bootstrap
 * credentials behind an unauthenticated route would allow a crawler or attacker
 * to trigger a privileged mutation.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "HTTP owner provisioning is disabled. Use the deployment bootstrap workflow.",
      code: "SETUP_ENDPOINT_RETIRED",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export const POST = GET;
