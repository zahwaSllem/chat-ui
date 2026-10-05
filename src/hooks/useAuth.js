import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

// Removes OAuth leftovers (#access_token=…, ?code=…) from the address bar.
function cleanAuthUrl() {
  const { hash, search, pathname } = window.location;
  const hasHash = /access_token|refresh_token|error_description/.test(hash);
  const hasCode = /[?&](code|error_description)=/.test(search);
  if (hasHash || hasCode) window.history.replaceState({}, document.title, pathname);
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        if (data.session) cleanAuthUrl();
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) cleanAuthUrl();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(
    () =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      }),
    []
  );

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { user, loading, signInWithGoogle, signOut };
}
