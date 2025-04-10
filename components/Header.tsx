"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AuthModal from "@/components/AuthModal"
import { useSearchParams } from "next/navigation"

export default function Header() {
  const { data: session, status } = useSession()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const searchParams = useSearchParams()
  
  // Check for OAuth errors
  const error = searchParams.get("error")
  const email = searchParams.get("email")
  
  // Show modal automatically when there's an OAuth error
  useEffect(() => {
    // Check for OAuth account linking parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const emailParam = urlParams.get('email');
    const oauthInfoParam = urlParams.get('oauthInfo');
    
    // Log for debugging
    if (errorParam === "OAuthAccountNotLinked") {
      console.log("OAuth account linking needed for email:", emailParam);
    }
    
    if (errorParam === "OAuthAccountNotLinked" && emailParam) {
      if (oauthInfoParam) {
        try {
          // Decode the base64 OAuth information
          const decodedInfo = atob(oauthInfoParam);
          console.log("Storing OAuth info for account linking");
          
          // Store it in sessionStorage for the SignInForm to use
          sessionStorage.setItem('pendingLinkOAuthInfo', decodedInfo);
        } catch (err) {
          console.error("Failed to decode OAuth information", err);
        }
      } else {
        console.warn("No OAuth info provided for account linking");
      }

      // Open the auth modal in link-account mode
      setAuthModalOpen(true);
      
      // Clean up the URL by removing the query parameters
      // This prevents the modal from reopening if the user refreshes the page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [error, email])

  // Log session details whenever they change
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log("Authenticated session:", { 
        user: session.user,
        email: session.user.email 
      });
    }
  }, [session, status]);

  const handleSignOut = async () => {
    await signOut({ redirect: false })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

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
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          Feature Requests
        </Link>

        <div className="flex items-center gap-4">
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

          {status === "authenticated" && session.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    {session.user.image ? (
                      <AvatarImage src={session.user.image} alt={session.user.name || ""} />
                    ) : (
                      <AvatarFallback>
                        {session.user.name ? getInitials(session.user.name) : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user.name && <p className="font-medium">{session.user.name}</p>}
                    {session.user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                {session.user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setAuthModalOpen(true)}>
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="signin"
        linkEmail={email}
      />
    </header>
  )
}

