"use client";

export default function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button type="submit" style={{ padding: "8px 10px", borderRadius: 8 }}>
        Logout
      </button>
    </form>
  );
}
