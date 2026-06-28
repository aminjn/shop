/** Route-level loading UI. Its presence makes client-side navigations commit
 *  IMMEDIATELY (showing this fallback) instead of waiting for the slow server
 *  to respond — which previously made links appear to need two clicks. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[1280px] items-center justify-center px-[22px] py-40">
      <span
        className="inline-block h-11 w-11 animate-spin rounded-full"
        style={{ border: "3px solid var(--border)", borderTopColor: "var(--accent)" }}
        aria-label="loading"
      />
    </div>
  );
}
