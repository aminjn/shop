"use client";

import { useEffect } from "react";

/** Injects a JSON-LD structured-data script into <head> on the client.
 *  Used for page sections whose data is loaded at runtime (e.g. the editable
 *  homepage FAQ). Google renders JS, so client-injected schema is picked up. */
export function JsonLd({ id, data }: { id: string; data: unknown }) {
  useEffect(() => {
    if (!data) return;
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => { el?.parentElement?.removeChild(el); };
  }, [id, data]);
  return null;
}
