"use client";

import { useEffect } from "react";
import { SystemScreen } from "@/features/system/system-screen";

/** Runtime errors inside the site layout. An error-reporting service would receive them here. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <SystemScreen kind="error" onRetry={retry} />;
}
