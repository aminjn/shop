import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  return NextResponse.json({
    session: s ? { mobile: s.mobile, role: s.role } : null,
  });
}
