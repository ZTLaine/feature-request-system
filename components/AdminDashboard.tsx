"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "./ui/badge"
import { Loader2, ArrowLeft } from "lucide-react"

type StatusDistribution = {
  status: string
  _count: number
}

type StatusChange = {
  createdAt: string
  _count: number
}

type PopularFeature = {
  featureId: string
  _count: number
}

type MetricsData = {
  userCount: number
  featureCount: number
  voteCount: number
  statusDistribution: StatusDistribution[]
  statusChangesOverTime: StatusChange[]
  popularFeatures: PopularFeature[]
}

type Feature = {
  id: string
  title: string
  description: string
  status: "PENDING" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DENIED"
  createdAt: string
  votes: { userId: string }[]
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch metrics
        const metricsResponse = await fetch("/api/admin/metrics")
        if (!metricsResponse.ok) {
          throw new Error("Failed to fetch metrics")
        }
        const metricsData = await metricsResponse.json()

        // Fetch features
        const featuresResponse = await fetch("/api/admin/features")
        if (!featuresResponse.ok) {
          throw new Error("Failed to fetch features")
        }
        const featuresData = await featuresResponse.json()

        if (isMounted) {
          setMetrics(metricsData)
          setFeatures(featuresData)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred")
          toast({
            title: "Error",
            description: "Failed to fetch dashboard data",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [toast])

  const handleStatusChange = async (featureId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/features/${featureId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      // Refresh features list
      const featuresResponse = await fetch("/api/admin/features")
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json()
        setFeatures(featuresData)
      }

      toast({
        title: "Success",
        description: "Feature status updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature status",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Feature Request Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold">{metrics?.userCount || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Features</h3>
            <p className="text-2xl font-bold">{metrics?.featureCount || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Votes</h3>
            <p className="text-2xl font-bold">{metrics?.voteCount || 0}</p>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics?.statusDistribution.map((status) => (
              <TableRow key={status.status}>
                <TableCell className="font-medium">{status.status}</TableCell>
                <TableCell>{status._count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Requests</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(features) && features.length > 0 ? (
              features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">{feature.title}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className="capitalize whitespace-nowrap inline-flex items-center"
                    >
                      {feature.status.toLowerCase().replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{feature.votes.length}</TableCell>
                  <TableCell>
                    {new Date(feature.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Change Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Status</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {["PENDING", "PLANNED", "IN_PROGRESS", "COMPLETED", "DENIED"].map((status) => (
                            <Button
                              key={status}
                              variant={feature.status === status ? "default" : "outline"}
                              onClick={() => handleStatusChange(feature.id, status)}
                            >
                              {status.toLowerCase().replace("_", " ")}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No feature requests available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 