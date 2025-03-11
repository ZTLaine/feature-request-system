"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignUpForm from "@/components/SignUpForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSignUpSuccess = () => {
    router.push("/auth/signin");
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to get started with our application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
            </div>
          )}
          <SignUpForm onSuccess={handleSignUpSuccess} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 