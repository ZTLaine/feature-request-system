"use client"

import { SessionProvider } from "next-auth/react"
import { FeatureContext } from "@/contexts/FeatureContext"
import { useState, useCallback } from "react"

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshFeatures = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <SessionProvider>
      <FeatureContext.Provider value={{ 
        refreshFeatures,
        refreshTrigger
      }}>
        {children}
      </FeatureContext.Provider>
    </SessionProvider>
  )
} 