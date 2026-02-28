/**
 * API Routes (Optional - minimal backend)
 * 
 * PayrollArena primarily uses on-chain data.
 * These routes are optional helpers for:
 * - Caching/indexing payroll data
 * - Email notifications
 * - Off-chain metadata storage
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "PayrollArena API",
    version: "1.0.0",
    status: "healthy",
  });
}
