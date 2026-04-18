"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function SupabaseAccountPanel() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  /** Sin cliente Supabase no hay nada que hidratar; con cliente esperamos a getSession. */
  const [ready, setReady] = useState(() => !supabase);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return (
      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Cuenta en la nube</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Configura{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          en <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> o en Vercel
          (Environment Variables) para habilitar inicio de sesión y sincronización con Supabase.
        </CardContent>
      </Card>
    );
  }

  if (!ready) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  if (user) {
    return (
      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Sesión activa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Correo: </span>
            <span className="font-medium">{user.email ?? user.id}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Con sesión iniciada, la app usa tus datos en Supabase. Si la cuenta está vacía, importa
            un JSON desde la pestaña Datos.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const { error } = await supabase.auth.signOut();
              setBusy(false);
              if (error) toast.error(error.message);
              else toast.success("Sesión cerrada");
            }}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  const runAuth = async (mode: "signIn" | "signUp") => {
    if (!email.trim() || !password) {
      toast.error("Introduce correo y contraseña");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signUp") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Revisa el correo para confirmar la cuenta si está activada la verificación.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Sesión iniciada");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Cuenta en la nube</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Inicia sesión para guardar y leer datos en Supabase. Sin sesión, todo queda solo en este
          dispositivo (IndexedDB).
        </p>
        <div className="grid gap-2">
          <Label htmlFor="sb-email">Correo</Label>
          <Input
            id="sb-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sb-password">Contraseña</Label>
          <Input
            id="sb-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="rounded-xl"
            disabled={busy}
            onClick={() => void runAuth("signIn")}
          >
            Entrar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={busy}
            onClick={() => void runAuth("signUp")}
          >
            Crear cuenta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
