import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar conta | Simulador Tributário Martins & Ferri" },
      {
        name: "description",
        content: "Criação de conta de acesso para a equipe do escritório Martins & Ferri.",
      },
      { property: "og:title", content: "Criar conta | Simulador Tributário Martins & Ferri" },
      {
        property: "og:description",
        content: "Cadastre uma conta de acesso interno ao simulador de carga tributária.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Conta criada. Bem-vindo!");
      void navigate({ to: "/" });
      return;
    }
    toast.success("Conta criada. Faça login para continuar.");
    void navigate({ to: "/login" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Criar conta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Uso interno — crie a conta de acesso da equipe do escritório.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={criarConta} className="space-y-4">
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
                autoComplete="new-password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Criando…" : "Criar conta"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
