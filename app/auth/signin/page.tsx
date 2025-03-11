"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SignInForm from "@/components/SignInForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // Process error messages
  useEffect(() => {
    if (error === "OAuthAccountNotLinked") {
      // Extract email from state if available
      const email = searchParams.get("email");
      if (email) {
        setEmail(email);
      }
      setErrorMessage(
        "An account with this email already exists. Would you like to link your Google account to your existing account?"
      );
    } else if (error) {
      setErrorMessage("An error occurred during sign in. Please try again.");
    }
  }, [error, searchParams]);

  const handleSignInSuccess = () => {
    router.push(callbackUrl);
  };

  const handleLinkAccounts = async () => {
    // This would require backend support for account linking
    // For now, instruct the user to sign in with their credentials first
    setIsLinking(true);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
              {errorMessage}
              {error === "OAuthAccountNotLinked" && !isLinking && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    className="mr-2" 
                    onClick={handleLinkAccounts}
                  >
                    Link Accounts
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {isLinking ? (
            <div className="text-sm mb-4">
              <p>Please sign in with your email and password to link your Google account:</p>
            </div>
          ) : null}
          
          <SignInForm onSuccess={handleSignInSuccess} linkEmail={isLinking ? email : undefined} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 