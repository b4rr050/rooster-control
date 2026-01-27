import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Next.js 15: cookies() é readonly → cast controlado
          const mutableCookies = cookieStore as any;

          cookiesToSet.forEach(({ name, value, options }) => {
            mutableCookies.set(name, value, options);
          });
        },
      },
    }
  );
}
