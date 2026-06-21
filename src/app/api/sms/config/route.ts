import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { smsConfigPublic } from "@/lib/ippanel";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, config: smsConfigPublic() });
}
