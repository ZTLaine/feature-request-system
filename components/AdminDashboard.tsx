"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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

type FeatureMetrics = {
  status: string
  count: number
  averageDuration: number
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
  const [metrics, setMetrics] = useState<FeatureMetrics[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch metrics
      const metricsResponse = await fetch("/api/admin/metrics")
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      // Fetch features
      const featuresResponse = await fetch("/api/admin/features")
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json()
        setFeatures(featuresData)
      }
    }

    fetchData()
  }, [])

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Feature Request Metrics</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Average Duration (days)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.status}>
                <TableCell className="font-medium">{metric.status}</TableCell>
                <TableCell>{metric.count}</TableCell>
                <TableCell>
                  {metric.averageDuration.toFixed(1)}
                </TableCell>
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
            {features.map((feature) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 