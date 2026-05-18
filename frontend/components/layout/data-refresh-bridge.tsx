"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DataRefreshBridge() {
  const router = useRouter();

  useEffect(() => {
    const handleRefresh = () => {
      router.refresh();
    };

    window.addEventListener("spmi-data-changed", handleRefresh as EventListener);

    return () => {
      window.removeEventListener("spmi-data-changed", handleRefresh as EventListener);
    };
  }, [router]);

  return null;
}
