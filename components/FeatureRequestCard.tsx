"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"
import { ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"

type FeatureRequestProps = {
  id: string
  title: string
  description: string
  status: "PENDING" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DENIED"
  votes: number
  hasVoted: boolean
  onVote: (id: string) => Promise<void>
}

export default function FeatureRequestCard({
  id,
  title,
  description,
  status,
  votes,
  hasVoted,
  onVote,
}: FeatureRequestProps) {
  const { data: session } = useSession()
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async () => {
    if (!session) return
    setIsVoting(true)
    try {
      await onVote(id)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <span className={cn(
            "text-sm px-2 py-1 rounded-full",
            status === "PENDING" && "bg-gray-100 text-gray-700",
            status === "PLANNED" && "bg-blue-100 text-blue-700",
            status === "IN_PROGRESS" && "bg-yellow-100 text-yellow-700",
            status === "COMPLETED" && "bg-green-100 text-green-700",
            status === "DENIED" && "bg-red-100 text-red-700"
          )}>
            {status.toLowerCase().replace("_", " ")}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", hasVoted && "bg-primary text-primary-foreground")}
          onClick={handleVote}
          disabled={!session || isVoting}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{votes}</span>
        </Button>
      </div>
    </div>
  )
}