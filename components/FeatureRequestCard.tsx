"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"
import { ThumbsUp, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowUp } from "lucide-react"
import { Card } from "./ui/card"

type FeatureRequestProps = {
  id: string
  title: string
  description: string
  status: "PENDING" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DENIED"
  votes: number
  hasVoted: boolean
  creatorId: string
  onVote: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function FeatureRequestCard({
  id,
  title,
  description,
  status,
  votes,
  hasVoted,
  creatorId,
  onVote,
  onDelete,
}: FeatureRequestProps) {
  const { data: session } = useSession()
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleVote = async () => {
    if (!session) return
    setIsVoting(true)
    try {
      await onVote(id)
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(id)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature request",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const isCreator = session?.user?.id === creatorId

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2 min-h-[40px] flex items-center break-words">{title}</h3>
          <p className="text-gray-600 mb-4 break-words">{description}</p>
          <span className={cn(
            "text-sm px-2 py-1 rounded-full whitespace-nowrap inline-flex items-center",
            status === "PENDING" && "bg-gray-100 text-gray-700",
            status === "PLANNED" && "bg-blue-100 text-blue-700",
            status === "IN_PROGRESS" && "bg-yellow-100 text-yellow-700",
            status === "COMPLETED" && "bg-green-100 text-green-700",
            status === "DENIED" && "bg-red-100 text-red-700"
          )}>
            {status.toLowerCase().replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVote(id)}
            className={cn(
              "h-10 px-4",
              hasVoted && "bg-blue-50 text-blue-600 hover:bg-blue-100"
            )}
          >
            <ArrowUp className="mr-1 h-4 w-4" />
            {votes}
          </Button>
          {session?.user?.id === creatorId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}