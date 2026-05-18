"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  LoaderCircle,
  Server,
  BadgeCheck,
  Database,
} from "lucide-react";
import { fallbackSeedUsers } from "@/lib/spmi-catalog-data";
import {
  AUTH_SESSION_KEY,
  clientApiRequest,
  dispatchAppEvent,
  LOCAL_USER_KEY,
  saveAuthSession,
  saveLocalSession,
} from "@/lib/spmi-session-client";

type SubmitState = "idle" | "loading" | "success" | "error";

type LoginFields = {
  username: string;
  password: string;
  rememberMe: boolean;
};

const SUCCESS_DELAY_MS = 1500;

export function LoginForm() {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  });

  const seedUsers = fallbackSeedUsers.length > 0 ? fallbackSeedUsers : [{
    email: "admin@spmi.local",
    password: "Password123!",
    role: "admin",
    name: "SPMI Admin",
  }];

  async function finalizeLogin(email: string, name?: string) {
    setSubmitState("success");
    setSubmitMessage(`Berhasil masuk sebagai ${name || email}. Mengarahkan ke dashboard...`);
    await new Promise((resolve) => window.setTimeout(resolve, SUCCESS_DELAY_MS));
    router.push("/dashboard");
  }

  const onSubmit = handleSubmit(async ({ username, password }) => {
    setSubmitState("loading");
    setSubmitMessage("");

    const normalizedUsername = username.trim();
    const normalizedPassword = password;

    try {
      const response = await clientApiRequest("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedUsername,
          password: normalizedPassword,
          device_name: "spmi-web",
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          token?: string;
          user?: { id?: number; name?: string; email?: string };
          roles?: string[];
          data?: {
            token?: string;
            user?: { id?: number; name?: string; email?: string };
            roles?: string[];
          };
        };
        const session = payload.data ?? payload;

        saveAuthSession({
          token: session.token,
          user: session.user,
          roles: session.roles,
        });
        if (session.token) {
          window.localStorage.setItem("spmi_token", session.token);
        }
        window.localStorage.setItem(
          "spmi_user",
          JSON.stringify(session.user ?? { email: normalizedUsername, name: normalizedUsername })
        );
        dispatchAppEvent("spmi-session-changed");
        dispatchAppEvent("spmi-data-changed");

        await finalizeLogin(session.user?.email ?? normalizedUsername, session.user?.name);
        return;
      }

      const failedPayload = (await response.json().catch(() => null)) as { message?: string } | null;
      setSubmitState("error");
      setSubmitMessage(failedPayload?.message || "Kredensial tidak valid atau akses ditolak.");
      return;
    } catch {
      // Fall back to local session below when API is unavailable.
    }

    const matchedSeedUser = seedUsers.find(
      (item) => item.email === normalizedUsername && item.password === normalizedPassword
    );

    if (!matchedSeedUser) {
      setSubmitState("error");
      setSubmitMessage("API tidak terjangkau dan akun demo yang dimasukkan tidak cocok.");
      return;
    }

    const role = matchedSeedUser.role || "admin";

    saveLocalSession({
      user: {
        name: matchedSeedUser.name || "Local User",
        email: normalizedUsername,
      },
      roles: [role],
      isLocal: true,
    });
    window.localStorage.setItem("spmi_token", `local-${role}`);
    window.localStorage.setItem(
      "spmi_user",
      JSON.stringify({ name: matchedSeedUser.name || "Local User", email: normalizedUsername })
    );
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    window.localStorage.setItem(
      LOCAL_USER_KEY,
      JSON.stringify({
        user: { name: matchedSeedUser.name || "Local User", email: normalizedUsername },
        roles: [role],
        isLocal: true,
      })
    );
    dispatchAppEvent("spmi-session-changed");
    dispatchAppEvent("spmi-data-changed");

    await finalizeLogin(normalizedUsername, matchedSeedUser.name);
  });

  return (
    <form className="spmi-login-form" onSubmit={onSubmit}>
      <div className="spmi-login-brand">
        <div className="spmi-login-brand-mark" aria-hidden="true">
          <ShieldCheck size={20} strokeWidth={2} />
        </div>
        <span>SPMI Universitas Junrejo Nusantara</span>
      </div>

      <header className="spmi-login-header">
        <h1>Selamat datang kembali</h1>
        <p>Masuk untuk mengakses dashboard mutu, dokumen, dan area kerja internal kampus.</p>
      </header>

      <div className="spmi-security-banner" aria-label="Informasi keamanan">
        <div className="spmi-security-banner-icon" aria-hidden="true">
          <Lock size={16} strokeWidth={2} />
        </div>
        <div>
          <strong>Akses Aman</strong>
          <p>Otentikasi login dilindungi untuk menjaga akses akun dan data mutu tetap privat.</p>
        </div>
      </div>

      <div className="spmi-field-group">
        <label className="spmi-field-label" htmlFor="username">
          Username
        </label>
        <div className="spmi-input-shell">
          <span className="spmi-input-icon" aria-hidden="true">
            <User size={18} strokeWidth={2} />
          </span>
          <input
            id="username"
            type="text"
            autoComplete="username"
            inputMode="email"
            placeholder="admin@spmi.local"
            aria-invalid={errors.username ? "true" : "false"}
            {...register("username", {
              required: "Username wajib diisi.",
              validate: (value) => value.trim().length > 0 || "Username wajib diisi.",
            })}
          />
        </div>
        <p className="spmi-field-hint">
          {errors.username?.message || "Gunakan akun institusi atau akun lokal SPMI yang sudah terdaftar."}
        </p>
      </div>

      <div className="spmi-password-meta">
        <label className="spmi-field-label" htmlFor="password">
          Password
        </label>
        <a href="/access-info">Lupa password?</a>
      </div>

      <div className="spmi-field-group">
        <div className="spmi-input-shell">
          <span className="spmi-input-icon" aria-hidden="true">
            <Lock size={18} strokeWidth={2} />
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan password Anda"
            aria-invalid={errors.password ? "true" : "false"}
            {...register("password", {
              required: "Password wajib diisi.",
              minLength: {
                value: 8,
                message: "Password minimal 8 karakter.",
              },
            })}
          />
          <button
            className="spmi-password-toggle"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
          </button>
        </div>
        <p className="spmi-field-hint">
          {errors.password?.message || "Minimal 8 karakter. Perhatikan huruf besar, kecil, dan simbol."}
        </p>
      </div>

      <label className="spmi-checkbox">
        <input type="checkbox" {...register("rememberMe")} />
        <span>Ingat saya</span>
      </label>

      <button
        className={[
          "spmi-submit-button",
          submitState === "success" ? "spmi-submit-button-success" : "",
        ].filter(Boolean).join(" ")}
        type="submit"
        disabled={submitState === "loading" || submitState === "success"}
      >
        {submitState === "loading" ? (
          <>
            <LoaderCircle className="spmi-spin" size={18} strokeWidth={2} />
            <span>Memverifikasi...</span>
          </>
        ) : submitState === "success" ? (
          <>
            <Check size={18} strokeWidth={2} />
            <span>Berhasil masuk!</span>
          </>
        ) : (
          <span>Masuk ke Dashboard</span>
        )}
      </button>

      {submitState === "error" && submitMessage ? (
        <p className="spmi-form-status spmi-form-status-error" aria-live="polite">
          {submitMessage}
        </p>
      ) : null}

      <div className="spmi-divider" aria-hidden="true">
        <span></span>
        <strong>atau</strong>
        <span></span>
      </div>

      <div className="spmi-alt-grid">
        <button type="button" className="spmi-alt-button">
          SSO Universitas
        </button>
        <button type="button" className="spmi-alt-button">
          NIM / NIDN
        </button>
      </div>

      <footer className="spmi-login-footer">
        <p>Belum punya akun? Hubungi Admin Mutu</p>
        <div className="spmi-trust-grid">
          <span>
            <BadgeCheck size={14} strokeWidth={2} />
            SSL Terenkripsi
          </span>
          <span>
            <Database size={14} strokeWidth={2} />
            Data Privat
          </span>
          <span>
            <Server size={14} strokeWidth={2} />
            Server Lokal
          </span>
        </div>
      </footer>
    </form>
  );
}
