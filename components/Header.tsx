"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthModal from "./AuthModal"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

export default function Header() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  
  console.log('Session data:', session)

  const toggleRole = async () => {
    try {
      const response = await fetch("/api/dev/toggle-role", {
        method: "POST",
      })
      
      if (response.ok) {
        // Force a hard refresh of the session
        await signOut({ redirect: false }) // Sign out without redirecting
        // Wait a moment for the session to clear
        await new Promise(resolve => setTimeout(resolve, 100))
        // Refresh the page to trigger a new sign in
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to toggle role:", error)
    }
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            FeatureVote
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link 
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Admin Dashboard
            </Link>
          )}
          {session?.user && process.env.NODE_ENV === "development" && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {session.user.role || 'No Role'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleRole}
              >
                Toggle Role
              </Button>
            </div>
          )}
        </div>
        <nav>
          {session ? (
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          ) : (
            <AuthModal />
          )}
        </nav>
      </div>
    </header>
  )
}

