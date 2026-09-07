const LEGACY_DATABASE_NAME = "life-tree-local";

export async function clearLegacyBrowserContent() {
  localStorage.removeItem("life_tree_posts");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (globalThis.indexedDB) {
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(LEGACY_DATABASE_NAME);
      request.onsuccess = resolve;
      request.onerror = resolve;
      request.onblocked = resolve;
    });
  }

  if (globalThis.caches) {
    const keys = await caches.keys().catch(() => []);
    await Promise.all(
      keys
        .filter((key) => key.startsWith("life-tree-static-"))
        .map((key) => caches.delete(key)),
    );
  }

  if (globalThis.navigator?.serviceWorker) {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
    await Promise.all(
      registrations
        .filter((registration) =>
          registration.active?.scriptURL?.endsWith("/sw.js") ||
          registration.waiting?.scriptURL?.endsWith("/sw.js") ||
          registration.installing?.scriptURL?.endsWith("/sw.js"),
        )
        .map((registration) => registration.unregister()),
    );
  }
}
