export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getAllPosts, processQueue } = await import("@/lib/posts");
    // every 20s: auto-publish due posts + generate one queued article
    setInterval(() => {
      (async () => {
        try {
          getAllPosts();
          await processQueue();
        } catch {
          /* ignore */
        }
      })();
    }, 20_000);
  }
}
