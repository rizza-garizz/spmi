"use client";

import type { ReactNode } from "react";
import type { AppRole } from "@/lib/spmi-access";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";

export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: {
  allowedRoles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const roles = useCurrentRoles();

  if (!hasRoleAccess(allowedRoles, roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
