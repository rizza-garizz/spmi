"use client";

import { useEffect, useState } from "react";
import { getCurrentRoles, type AppRole } from "@/lib/spmi-access";

export function useCurrentRoles() {
  const [roles, setRoles] = useState<AppRole[]>(["guest"]);

  useEffect(() => {
    const syncRoles = () => {
      setRoles(getCurrentRoles());
    };

    syncRoles();
    window.addEventListener("spmi-session-changed", syncRoles);

    return () => {
      window.removeEventListener("spmi-session-changed", syncRoles);
    };
  }, []);

  return roles;
}
