import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const role = (requestUrl.searchParams.get('role') as 'admin' | 'superadmin' | 'participant') || 'participant';
  const refCode = requestUrl.searchParams.get('ref');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;

      // Check if user exists in public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!existingUser) {
        const username = user.email
          ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
          : `user_${Date.now()}`;
        const newRefCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        let referrerId: string | null = null;
        if (refCode) {
          const { data: refUser } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', refCode.trim().toUpperCase())
            .single();
          if (refUser) {
            referrerId = refUser.id;
          }
        }

        // Insert new profile into public.users
        await supabase.from('users').insert({
          id: user.id,
          username: username,
          email: user.email,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            username,
          avatar_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null,
          role: role,
          auth_provider: 'google',
          google_id: user.id,
          referral_code: newRefCode,
          referred_by: referrerId,
          total_points: referrerId ? 10 : 0,
          total_referrals: 0,
        });

        // If referrer exists, award them referral bonus
        if (referrerId) {
          await supabase.from('referrals').insert({
            referrer_id: referrerId,
            referee_id: user.id,
            bonus_points_awarded: 25,
          });

          const { data: refProfile } = await supabase
            .from('users')
            .select('total_points, total_referrals')
            .eq('id', referrerId)
            .single();

          if (refProfile) {
            await supabase
              .from('users')
              .update({
                total_points: (refProfile.total_points || 0) + 25,
                total_referrals: (refProfile.total_referrals || 0) + 1,
              })
              .eq('id', referrerId);
          }
        }
      }

      if (role === 'admin' || role === 'superadmin') {
        return NextResponse.redirect(`${origin}/admin/dashboard`);
      } else {
        return NextResponse.redirect(`${origin}/explore`);
      }
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${origin}/login`);
}
