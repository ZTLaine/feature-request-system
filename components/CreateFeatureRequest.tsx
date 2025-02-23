"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useFeatures } from "@/contexts/FeatureContext"

const featureRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

type FeatureRequestValues = z.infer<typeof featureRequestSchema>

export default function CreateFeatureRequest() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const { refreshFeatures } = useFeatures()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeatureRequestValues>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: '',
      description: ''
    }
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: FeatureRequestValues) => {
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a feature request",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create feature request")
      }

      toast({
        title: "Success",
        description: "Your feature request has been created.",
      })
      reset()
      setIsOpen(false)
      refreshFeatures()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create feature request. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (status === "loading") {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Submit Feature Request</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a Feature Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div>
            <Textarea
              placeholder="Description"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || !session}>
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}