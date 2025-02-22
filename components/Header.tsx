"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import AuthModal from "./AuthModal"
import { Button } from "./ui/button"

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          FeatureVote
        </Link>
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

