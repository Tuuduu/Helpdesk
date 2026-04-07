"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api";

export interface Branding {
  companyName: string;
  companySubtitle: string;
  logoText: string;
}

interface BrandingContextType extends Branding {
  refresh: () => Promise<void>;
}

const defaults: Branding = {
  companyName: "BISHRELT",
  companySubtitle: "GROUP",
  logoText: "BG",
};

const BrandingContext = createContext<BrandingContextType>({
  ...defaults,
  refresh: async () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaults);

  const refresh = useCallback(async () => {
    const res = await api.get<Branding>("/settings/branding");
    if (res.success && res.data) setBranding(res.data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ ...branding, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
