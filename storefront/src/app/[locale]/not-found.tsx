import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-28 text-center"
      style={{ minHeight: "50vh" }}
    >
      <div className="text-[64px] font-black" style={{ color: "var(--accent)" }}>
        ۴۰۴
      </div>
      <p className="mt-2 text-[16px]" style={{ color: "var(--muted)" }}>
        صفحه‌ای که دنبالش بودید پیدا نشد — Page not found
      </p>
      <Link
        href="/fa"
        className="mt-6 rounded-[12px] px-7 py-3 text-[15px] font-bold text-white no-underline"
        style={{ background: "var(--accent)" }}
      >
        بازگشت به خانه / Home
      </Link>
    </div>
  );
}
