"use client"

import Header from "@/components/Header"
import CreateFeatureRequest from "@/components/CreateFeatureRequest"
import FeatureRequestList from "@/components/FeatureRequestList"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Feature Request System</h1>
          <CreateFeatureRequest />
        </div>
        <p className="text-xl text-center mb-12">
          Submit, upvote, and track feature requests for your favorite products!
        </p>
        <FeatureRequestList />
      </div>
      <Toaster />
    </main>
  )
}