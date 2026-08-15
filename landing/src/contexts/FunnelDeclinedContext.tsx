import { createContext, useContext, useState, ReactNode } from "react";

interface FunnelDeclinedContextType {
  declined: boolean;
  setDeclined: (declined: boolean) => void;
}

const FunnelDeclinedContext = createContext<FunnelDeclinedContextType>({
  declined: false,
  setDeclined: () => {},
});

export function FunnelDeclinedProvider({ children }: { children: ReactNode }) {
  const [declined, setDeclined] = useState(false);
  return (
    <FunnelDeclinedContext.Provider value={{ declined, setDeclined }}>
      {children}
    </FunnelDeclinedContext.Provider>
  );
}

export function useFunnelDeclined() {
  return useContext(FunnelDeclinedContext);
}
