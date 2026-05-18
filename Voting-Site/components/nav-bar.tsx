"use client"

/**
 * Shared NavBar component used across all dashboard pages.
 * Includes role badge, user info, and a Sign Out button.
 */

import { useState } from "react"
import { Vote, LogOut, ChevronDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import type { UserRole } from "@/lib/database.types"

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  election_creator: "Election Creator",
  voter: "Voter",
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/30",
  election_creator: "bg-primary/10 text-primary border-primary/30",
  voter: "bg-success/10 text-success border-success/30",
}

interface NavBarProps {
  /** Extra content rendered in the right side of the header (e.g. "Create Election" button) */
  actions?: React.ReactNode
  role?: UserRole | null
  userName?: string | null
  userEmail?: string | null
}

export function NavBar({ actions, role, userName, userEmail }: NavBarProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      // Hard redirect to clear all client state
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error("Sign out error:", err)
    } finally {
      setIsSigningOut(false)
    }
  }

  const displayName = userName ?? userEmail?.split("@")[0] ?? "Account"
  const roleLabel = role ? ROLE_LABELS[role] : null
  const roleColor = role ? ROLE_COLORS[role] : ""

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left — Logo + role badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">SecureVote</span>
          </Link>
          {roleLabel && (
            <Badge variant="outline" className={`hidden sm:flex gap-1 ${roleColor}`}>
              {roleLabel}
            </Badge>
          )}
        </div>

        {/* Right — extra actions + user menu */}
        <div className="flex items-center gap-2">
          {actions}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm truncate">{displayName}</span>
                  {userEmail && (
                    <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
                  )}
                  {roleLabel && (
                    <Badge variant="outline" className={`w-fit mt-1 text-xs ${roleColor}`}>
                      {roleLabel}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Vote className="h-4 w-4 mr-2" />
                  View Elections
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Sign Out */}
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                {isSigningOut ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
