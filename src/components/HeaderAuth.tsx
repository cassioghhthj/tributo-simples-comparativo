import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const linkClass = "rounded-md px-3 py-1.5 transition-colors hover:bg-sidebar-accent";
const activeProps = { className: "bg-sidebar-accent rounded-md px-3 py-1.5" };

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
      <nav className="flex items-center gap-1 text-sm">
        <Link to="/login" className={linkClass}>
          Entrar
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link to="/" className={linkClass} activeProps={activeProps} activeOptions={{ exact: true }}>
        Empresas
      </Link>
      <Link to="/apuracoes/nova" className={linkClass} activeProps={activeProps}>
        Nova apuração
      </Link>
      <Link to="/empresas/nova" className={linkClass} activeProps={activeProps}>
        Nova empresa
      </Link>
      <span className="mx-2 hidden text-xs text-sidebar-foreground/60 sm:inline">{email}</span>
      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          void navigate({ to: "/login" });
        }}
        className={`inline-flex items-center gap-1.5 ${linkClass}`}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </nav>
  );
}
