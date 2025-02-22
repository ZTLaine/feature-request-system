"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import FeatureRequestCard from "./FeatureRequestCard"

type Feature = {
  id: string
  title: string
  description: string
  status: "PENDING" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DENIED"
  votes: { userId: string }[]
}

export default function FeatureRequestList() {
  const { data: session } = useSession()
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/features")
      if (!response.ok) throw new Error("Failed to fetch features")
      const data = await response.json()
      setFeatures(data)
    } catch (err) {
      setError("Failed to load feature requests")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [])

  const handleVote = async (featureId: string) => {
    try {
      const response = await fetch(`/api/features/${featureId}/vote`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to vote")
      await fetchFeatures() // Refresh the list after voting
    } catch (err) {
      setError("Failed to vote on feature request")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    )
  }

  if (features.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No feature requests yet. Be the first to submit one!
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <FeatureRequestCard
          key={feature.id}
          id={feature.id}
          title={feature.title}
          description={feature.description}
          status={feature.status}
          votes={feature.votes.length}
          hasVoted={feature.votes.some(
            (vote) => vote.userId === session?.user?.id
          )}
          onVote={handleVote}
        />
      ))}
    </div>
  )
}