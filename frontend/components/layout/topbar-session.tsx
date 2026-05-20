"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_SESSION_KEY,
  LOCAL_USER_KEY,
  clientApiRequest,
  dispatchAppEvent,
  getLegacyUser,
  readAuthSession,
} from "@/lib/spmi-session-client";
import { getRoleLabel, getRoleSummary } from "@/lib/spmi-access";

export function TopbarSession() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [roleLabel, setRoleLabel] = useState("Belum Login");
  const [roleSummary, setRoleSummary] = useState("Masuk untuk melihat cakupan akses aktif.");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const syncSession = () => {
      const session = readAuthSession();
      const activeRole = session?.roles?.[0];

      if (session?.user) {
        setUser({
          name: session.user.name ?? "SPMI User",
          email: session.user.email ?? "Belum Login",
        });
        setRoleLabel(getRoleLabel(activeRole));
        setRoleSummary(getRoleSummary(activeRole));
        return;
      }

      const legacyUser = getLegacyUser();
      if (!legacyUser) {
        setUser(null);
        setRoleLabel("Belum Login");
        setRoleSummary("Masuk untuk melihat cakupan akses aktif.");
        return;
      }

      setUser({
        name: legacyUser.name ?? "SPMI User",
        email: legacyUser.email ?? "Belum Login",
      });
      setRoleLabel(getRoleLabel(activeRole));
      setRoleSummary(getRoleSummary(activeRole));
    };

    syncSession();
    window.addEventListener("spmi-session-changed", syncSession);

    return () => {
      window.removeEventListener("spmi-session-changed", syncSession);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutside = () => {
      setOpen(false);
    };

    window.addEventListener("click", handleOutside);
    return () => {
      window.removeEventListener("click", handleOutside);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await clientApiRequest("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Tetap bersihkan sesi lokal meski API logout tidak terjangkau.
    } finally {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem("spmi_token");
      localStorage.removeItem("spmi_user");
      dispatchAppEvent("spmi-session-changed");
      setOpen(false);
      router.push("/login");
    }
  };

  return (
    <li className="nav-item dropdown header-profile">
      <button
        type="button"
        className="nav-link header-profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <div className="header-info text-right me-3">
          <span className="text-black">
            <strong>{user?.name || "SPMI User"}</strong>
          </span>
          <p className="fs-12 mb-0">{user?.email || "Belum Login"}</p>
          <small className="header-role-copy">{roleLabel}</small>
        </div>
        <img src="/envato/images/user.jpg" width="20" alt="" />
      </button>
      <div
        className={`dropdown-menu dropdown-menu-end ${open ? "show" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dropdown-role-card">
          <div className="dropdown-role-label">Role aktif</div>
          <strong>{roleLabel}</strong>
          <p>{roleSummary}</p>
          <a href="/access-info" className="dropdown-role-link">
            Lihat detail role & akses
          </a>
        </div>
        <a
          href="/access-info"
          className="dropdown-item ai-icon"
          onClick={(event) => event.stopPropagation()}
        >
          <i className="la la-shield text-primary"></i>
          <span className="ms-2">Akses & role</span>
        </a>
        <button
          onClick={handleLogout}
          className="dropdown-item ai-icon text-danger"
          style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}
        >
          <i className="la la-sign-out text-danger"></i>
          <span className="ms-2">Keluar </span>
        </button>
      </div>
    </li>
  );
}
