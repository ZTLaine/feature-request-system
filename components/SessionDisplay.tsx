"use client"

import { useSession } from "next-auth/react"

export default function SessionDisplay() {
  const { data: session } = useSession()
  
  return (
    <div className="text-sm bg-gray-100 p-2 rounded">
      {JSON.stringify(session)}
    </div>
  )
} 