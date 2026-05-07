"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type AuthActionProps = {
  isAdmin: boolean;
};

export function AuthAction({ isAdmin }: AuthActionProps) {
  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    await signOut({
      redirectTo: "/",
    });
  }

  if (!isAdmin) {
    return (
      <Link
        className="auth-icon-link"
        href="/login"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
          <path d="M11 8l4 4-4 4" />
          <path d="M15 12H6" />
        </svg>
      </Link>
    );
  }

  return (
    <button
      className="auth-icon-link"
      type="button"
      onClick={handleLogout}
      aria-label="Logout"
      title="Logout"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M13 8l4 4-4 4" />
        <path d="M17 12H8" />
      </svg>
    </button>
  );
}
