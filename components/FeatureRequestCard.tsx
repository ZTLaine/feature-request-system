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
        <div className="flex gap-2">
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
          {isCreator && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your feature request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}