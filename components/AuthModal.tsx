"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import SignInForm from "@/components/SignInForm"
import SignUpForm from "@/components/SignUpForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"

export type AuthModalMode = "signin" | "signup" | "link-account"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: AuthModalMode
  onSuccess?: () => void
  linkEmail?: string | null
}

export default function AuthModal({ 
  open, 
  onOpenChange, 
  defaultMode = "signin", 
  onSuccess,
  linkEmail
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(defaultMode)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Handle various auth errors
  useEffect(() => {
    if (error === "OAuthAccountNotLinked" && linkEmail) {
      setMode("link-account")
      setErrorMessage(
        "An account with this email already exists. Sign in with your password to link your Google account."
      )
    } else if (error) {
      setErrorMessage("An error occurred during authentication. Please try again.")
    }
  }, [error, linkEmail])

  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {mode === "link-account" ? (
          <>
            <DialogHeader>
              <DialogTitle>Link Your Account</DialogTitle>
              <DialogDescription>
                Sign in with your password to link your Google account
              </DialogDescription>
            </DialogHeader>
            {errorMessage && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                {errorMessage}
              </div>
            )}
            <SignInForm onSuccess={handleSuccess} linkEmail={linkEmail} />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Authentication</DialogTitle>
              <DialogDescription>
                Sign in to your account or create a new one
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as AuthModalMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                    {errorMessage}
                  </div>
                )}
                <SignInForm onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm onSuccess={() => {
                  setMode("signin")
                  setErrorMessage("Account created! Please sign in.")
                }} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

