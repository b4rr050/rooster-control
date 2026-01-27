import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.signOut();

  // redirecionar para login (do lado do cliente)
  return NextResponse.redirect(new URL("/login", req.url), {
    headers: res.headers,
  });
}

// Opcional: se alguém abrir /api/auth/logout no browser
export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
