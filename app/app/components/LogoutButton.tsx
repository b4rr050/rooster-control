"use client";

import { logoutAction } from "@/app/app/actions/logout";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" style={{ padding: "8px 10px", borderRadius: 8 }}>
        Logout
      </button>
    </form>
  );
}
