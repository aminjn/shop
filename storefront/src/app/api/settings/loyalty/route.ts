import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readLoyalty, writeLoyalty, type LoyaltyConfig, type LoyaltyTier } from "@/lib/settings";

export async function GET() {
  // public: the storefront needs tiers/benefits to show members their status
  return NextResponse.json({ ok: true, loyalty: readLoyalty() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "super_admin") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const cur = readLoyalty();
  const int = (v: unknown, d: number) => { const x = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10); return Number.isFinite(x) ? x : d; };
  const pct = (v: unknown) => Math.min(100, Math.max(0, int(v, 0)));
  const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);

  const tiers: LoyaltyTier[] = Array.isArray(b.tiers)
    ? (b.tiers as unknown[])
        .map((x, i) => {
          const m = (x || {}) as Record<string, unknown>;
          return {
            key: str(m.key, 24) || `tier-${i}`,
            fa: str(m.fa, 40),
            en: str(m.en, 40),
            min: int(m.min, 0),
            discountPct: pct(m.discountPct),
          } as LoyaltyTier;
        })
        .filter((tr) => tr.fa.trim() || tr.en.trim())
        .sort((a, b2) => a.min - b2.min)
    : cur.tiers;

  const cfg: LoyaltyConfig = {
    enabled: Boolean(b.enabled),
    earnPerToman: Math.max(1, int(b.earnPerToman, cur.earnPerToman)),
    signupBonus: int(b.signupBonus, cur.signupBonus),
    reviewBonus: int(b.reviewBonus, cur.reviewBonus),
    pointValue: Math.max(0, int(b.pointValue, cur.pointValue)),
    redeemEnabled: Boolean(b.redeemEnabled),
    redeemMinPoints: Math.max(0, int(b.redeemMinPoints, cur.redeemMinPoints)),
    expiryMonths: Math.max(0, int(b.expiryMonths, cur.expiryMonths)),
    tiers: tiers.length ? tiers : cur.tiers,
  };
  return NextResponse.json({ ok: true, loyalty: writeLoyalty(cfg) });
}
