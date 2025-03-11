"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FcGoogle } from "react-icons/fc"

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type SignInFormValues = z.infer<typeof signInSchema>

interface SignInFormProps {
  onSuccess: () => void;
  linkEmail?: string | null;
}

export default function SignInForm({ onSuccess, linkEmail }: SignInFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  })

  // If linkEmail is provided, pre-fill the email field
  useEffect(() => {
    if (linkEmail) {
      setValue("email", linkEmail);
    }
  }, [linkEmail, setValue]);

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // If we're in linking mode, we need to call the link-account API
        if (linkEmail) {
          try {
            // Get OAuth information from localStorage or sessionStorage
            const oauthInfo = sessionStorage.getItem('pendingLinkOAuthInfo')
            
            if (!oauthInfo) {
              setError("OAuth information is missing. Please try again.")
              return
            }
            
            const oauthData = JSON.parse(oauthInfo)
            console.log("Linking account with OAuth data:", JSON.stringify(oauthData, null, 2))
            
            // Call our API to link the accounts
            const linkResponse = await fetch('/api/auth/link-account', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                provider: oauthData.provider,
                providerAccountId: oauthData.providerAccountId,
                accessToken: oauthData.access_token,
                refreshToken: oauthData.refresh_token,
                idToken: oauthData.id_token,
              }),
            })
            
            // Log response for debugging
            const responseData = await linkResponse.json()
            console.log("Link account response:", responseData)
            
            if (!linkResponse.ok) {
              throw new Error(responseData.error || 'Failed to link account')
            }
            
            // Clear the stored OAuth info
            sessionStorage.removeItem('pendingLinkOAuthInfo')
            
            // Success! Accounts are now linked
            onSuccess()
            
            // Force a refresh after a short delay to ensure NextAuth session is updated
            setTimeout(() => {
              window.location.reload()
            }, 500)
          } catch (err) {
            console.error('Error linking accounts:', err)
            setError("Failed to link account. Please try again.")
          }
        } else {
          onSuccess()
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signIn("google", { callbackUrl: window.location.origin });
      // Note: No onSuccess callback here as the redirect will be handled by NextAuth
    } catch (err) {
      setError("An error occurred with Google sign in")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {linkEmail ? "Link Account & Sign In" : isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      
      {!linkEmail && (
        <>
          <div className="flex items-center">
            <Separator className="flex-1" />
            <span className="px-3 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </>
      )}
    </div>
  )
}

