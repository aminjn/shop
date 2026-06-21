export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getAllPosts } = await import("@/lib/posts");
    // auto-publish scheduled posts whose time has arrived (every 60s)
    setInterval(() => {
      try {
        getAllPosts();
      } catch {
        /* ignore */
      }
    }, 60_000);
  }
}
