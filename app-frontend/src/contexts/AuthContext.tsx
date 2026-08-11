import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getConfig, getWhoAmI } from "@/lib/api";
import type { WhoAmI } from "@/types/api";

interface AuthContextType {
  user: WhoAmI | null;
  devLoginAvailable: boolean;
  diagnosticsPurchaseUrl: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  devLoginAvailable: false,
  diagnosticsPurchaseUrl: "",
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WhoAmI | null>(null);
  const [devLoginAvailable, setDevLoginAvailable] = useState(false);
  const [diagnosticsPurchaseUrl, setDiagnosticsPurchaseUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConfig(), getWhoAmI()]).then(([config, whoami]) => {
      setDevLoginAvailable(config.dev_login);
      setDiagnosticsPurchaseUrl(config.diagnostics_purchase_url);
      setUser(whoami?.is_authenticated ? whoami : null);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, devLoginAvailable, diagnosticsPurchaseUrl, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
