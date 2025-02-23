"use client"

import { createContext, useContext } from "react"

type FeatureContextType = {
  refreshFeatures: () => Promise<void>
  refreshTrigger: number
}

export const FeatureContext = createContext<FeatureContextType | null>(null)

export function useFeatures() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error("useFeatures must be used within a FeaturesProvider")
  }
  return context
} 