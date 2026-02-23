import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Store } from "@shared/schema";

interface StoreContextValue {
  stores: Store[];
  storesLoading: boolean;
  activeStore: Store | null;
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue>({
  stores: [],
  storesLoading: true,
  activeStore: null,
  activeStoreId: "",
  setActiveStoreId: () => {},
});

const STORAGE_KEY = "sellisy_active_store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const storesList = stores || [];

  const activeStoreId =
    storesList.find((s) => s.id === selectedId)?.id ||
    storesList[0]?.id ||
    "";

  const activeStore = storesList.find((s) => s.id === activeStoreId) || null;

  useEffect(() => {
    if (activeStoreId) {
      try {
        localStorage.setItem(STORAGE_KEY, activeStoreId);
      } catch {}
    }
  }, [activeStoreId]);

  const setActiveStoreId = useCallback((id: string) => {
    setSelectedId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  return (
    <StoreContext.Provider
      value={{
        stores: storesList,
        storesLoading: isLoading,
        activeStore,
        activeStoreId,
        setActiveStoreId,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useActiveStore() {
  return useContext(StoreContext);
}
