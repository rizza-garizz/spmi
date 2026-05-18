"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasAnySession } from "@/lib/spmi-session-client";
import { canAccessPath, getCurrentRoles } from "@/lib/spmi-access";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);

  const isPublicPath = pathname === "/login" || pathname === "/access-info";

  const isAuthorized = useMemo(() => {
    if (!mounted) return false;
    if (isPublicPath) return true;
    if (!hasAnySession()) return false;
    return canAccessPath(pathname, getCurrentRoles());
  }, [mounted, isPublicPath, pathname, sessionVersion]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect hanya jika sudah mount, bukan public path, dan tidak punya sesi
  useEffect(() => {
    if (!mounted) return;
    if (isPublicPath) return;
    if (!hasAnySession()) {
      router.replace("/login");
      return;
    }
    if (!canAccessPath(pathname, getCurrentRoles())) {
      router.replace("/dashboard");
    }
  }, [mounted, isPublicPath, router, pathname, sessionVersion]);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => {
      setSessionVersion((current) => current + 1);
    };
    window.addEventListener("spmi-session-changed", handler);
    return () => window.removeEventListener("spmi-session-changed", handler);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
