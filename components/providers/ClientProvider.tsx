"use client"

import { SessionProvider } from "next-auth/react"
import { FeatureContext } from "@/contexts/FeatureContext"
import { useState, useCallback, useMemo } from "react"

type ClientProviderProps = {
  readonly children: React.ReactNode
}

export default function ClientProvider({ children }: ClientProviderProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshFeatures = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const contextValue = useMemo(() => ({
    refreshFeatures,
    refreshTrigger
  }), [refreshFeatures, refreshTrigger])

  return (
    <SessionProvider>
      <FeatureContext.Provider value={contextValue}>
        {children}
      </FeatureContext.Provider>
    </SessionProvider>
  )
} 