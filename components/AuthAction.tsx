"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthActionProps = {
  isAdmin: boolean;
};

export function AuthAction({ isAdmin }: AuthActionProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  if (!isAdmin) {
    return (
      <Link className="auth-icon-link" href="/login" aria-label="Admin login" title="Admin login">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
          <path d="M3 12h11" />
          <path d="m11 8 4 4-4 4" />
        </svg>
      </Link>
    );
  }

  return (
    <button className="auth-icon-link" type="button" onClick={handleLogout} aria-label="Logout" title="Logout">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 7V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-2" />
        <path d="M21 12H10" />
        <path d="m13 8-4 4 4 4" />
      </svg>
    </button>
  );
}
