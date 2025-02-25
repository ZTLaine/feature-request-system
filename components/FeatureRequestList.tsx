"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import FeatureRequestCard from "@/components/FeatureRequestCard"
import { useToast } from "@/hooks/use-toast"
import { useFeatures } from "@/contexts/FeatureContext"

type Feature = {
  id: string
  title: string
  description: string
  status: "PENDING" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DENIED"
  votes: { userId: string }[]
  creatorId: string
}

export default function FeatureRequestList() {
  const { data: session } = useSession()
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { refreshTrigger } = useFeatures()

  const fetchFeatures = useCallback(async () => {
    try {
      const response = await fetch("/api/features")
      if (!response.ok) throw new Error("Failed to fetch features")
      const data = await response.json()
      setFeatures(data)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load feature requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures, refreshTrigger])

  const handleVote = async (featureId: string) => {
    try {
      const response = await fetch(`/api/features/${featureId}`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to vote")
      await fetchFeatures() // Refresh the list after voting
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to vote on feature request",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (featureId: string) => {
    try {
      const response = await fetch(`/api/features/${featureId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      
      toast({
        title: "Success",
        description: "Feature request deleted successfully",
      })
      
      // Use the existing fetchFeatures to refresh the list
      await fetchFeatures()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete feature request",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : features.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No feature requests yet. Be the first to submit one!
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
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
              creatorId={feature.creatorId}
              onVote={handleVote}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  )
}