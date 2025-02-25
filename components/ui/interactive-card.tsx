"use client"

import { cn } from "@/lib/utils"

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function InteractiveCard({ children, className, ...props }: InteractiveCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-[1.02] duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 