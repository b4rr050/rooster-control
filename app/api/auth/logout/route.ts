import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(
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
}

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  const supabase = createSupabase(req, res);
  await supabase.auth.signOut();
  return res;
}

// Para evitar 405 se alguém abrir /api/auth/logout diretamente
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  const supabase = createSupabase(req, res);
  await supabase.auth.signOut();
  return res;
}
