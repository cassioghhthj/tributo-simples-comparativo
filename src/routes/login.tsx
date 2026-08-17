import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Simulador Tributário Martins & Ferri" },
      {
        name: "description",
        content: "Acesso restrito à equipe do escritório Martins & Ferri Contabilidade.",
      },
      { property: "og:title", content: "Entrar | Simulador Tributário Martins & Ferri" },
      {
        property: "og:description",
        content: "Área de acesso da equipe ao simulador de carga tributária.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha inválidos."
          : error.message,
      );
      return;
    }
    toast.success("Bem-vindo de volta.");
    void navigate({ to: "/" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Entrar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acesso restrito à equipe do escritório.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
