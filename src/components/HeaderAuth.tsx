import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export function HeaderAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setPronto(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!pronto) return <div className="h-8" aria-hidden />;

  if (!email) {
    return (
      <Link
        to="/login"
        className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
      >
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-sidebar-foreground/60 sm:inline">{email}</span>
      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          void navigate({ to: "/login" });
        }}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </div>
  );
}
