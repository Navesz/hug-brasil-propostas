"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldOff, WifiOff } from "lucide-react";
import {
  fetchAccessConfig,
  RECHECK_INTERVAL_MS,
  type AccessConfig,
} from "@/lib/accessControl";

type AccessState =
  | { status: "loading" }
  | { status: "allowed" }
  | { status: "blocked"; message: string }
  | { status: "offline" };

const DEFAULT_BLOCKED_MESSAGE =
  "Este aplicativo foi desativado. Entre em contato com a HUG BRASIL para mais informações.";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const config: AccessConfig = await fetchAccessConfig();
        if (cancelled) return;

        if (!config.enabled) {
          setState({
            status: "blocked",
            message: config.message ?? DEFAULT_BLOCKED_MESSAGE,
          });
          return;
        }

        setState({ status: "allowed" });
      } catch {
        if (cancelled) return;
        setState({ status: "offline" });
      }
    }

    void verify();
    const interval = setInterval(() => void verify(), RECHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-600">
        <Loader2 className="h-10 w-10 animate-spin text-hug-blue" />
        <p className="text-sm">Verificando acesso...</p>
      </div>
    );
  }

  if (state.status === "blocked") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <ShieldOff className="h-14 w-14 text-red-500" />
        <h1 className="text-xl font-semibold text-slate-900">Acesso desativado</h1>
        <p className="max-w-md text-sm text-slate-600">{state.message}</p>
      </div>
    );
  }

  if (state.status === "offline") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <WifiOff className="h-14 w-14 text-amber-500" />
        <h1 className="text-xl font-semibold text-slate-900">Conexão necessária</h1>
        <p className="max-w-md text-sm text-slate-600">
          Este aplicativo precisa de internet para funcionar. Verifique sua conexão e
          recarregue a página.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
