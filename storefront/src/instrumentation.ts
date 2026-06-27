export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getAllPosts, processQueue, migrateInlineImages } = await import("@/lib/posts");
    // one-time: shrink posts.json by moving inline base64 cover images to files
    migrateInlineImages().catch(() => {});
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
