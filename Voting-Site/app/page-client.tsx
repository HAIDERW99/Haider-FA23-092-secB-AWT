"use client"

import { useState, useEffect } from "react"
import { Shield, Clock, CheckCircle, Users, Vote, BarChart3, Lock, Eye, ArrowRight, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useElections } from "@/hooks/use-elections"
import { useAuth } from "@/hooks/use-auth"
import type { Election } from "@/lib/database.types"

// ── Safe countdown — handles null/undefined targetDate ────────────────────
function safeTimeLeft(targetDate: Date | null | undefined) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const difference = targetDate.getTime() - Date.now()
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

function CountdownTimer({ targetDate }: { targetDate: string | null | undefined }) {
  // Parse the ISO string safely — null/undefined → null
  const parsed = targetDate ? new Date(targetDate) : null
  const [timeLeft, setTimeLeft] = useState(() => safeTimeLeft(parsed))

  useEffect(() => {
    if (!parsed) return
    const timer = setInterval(() => setTimeLeft(safeTimeLeft(parsed)), 1000)
    return () => clearInterval(timer)
  }, [targetDate]) // re-run if the date string changes

  if (!parsed) return null

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Clock className="h-4 w-4 text-accent" />
      <span className="text-foreground">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    </div>
  )
}

// ── Election card — maps Supabase snake_case fields safely ────────────────
function ElectionCard({
  election,
  status,
  index,
}: {
  election: Election
  status: "active" | "upcoming" | "completed"
  index: number
}) {
  // Supabase returns snake_case: ends_at, starts_at, registered_count, max_voters
  const participants = election.registered_count ?? 0
  const maxParticipants = election.max_voters ?? 1
  const progressPct = Math.min((participants / maxParticipants) * 100, 100)

  const electionId = election.id
  const listKey = electionId ?? `election-${index}`

  // Winner: top candidate by vote_count (from candidates join if available)
  const candidates = (election as any).candidates as Array<{ name: string; vote_count: number }> | undefined
  const winner = candidates
    ? [...(candidates ?? [])].sort((a, b) => b.vote_count - a.vote_count)[0]?.name
    : undefined

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:border-accent/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}
            className={status === "active" ? "bg-success text-success-foreground" : ""}
          >
            {status === "active" ? "Live" : status === "upcoming" ? "Upcoming" : "Completed"}
          </Badge>
          {status === "active" && (
            <CountdownTimer targetDate={election.ends_at} />
          )}
        </div>
        <CardTitle className="text-lg leading-tight text-balance">
          {election.title ?? "Untitled Election"}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {election.organization ?? ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {status === "upcoming" && election.starts_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Starts {new Date(election.starts_at).toLocaleDateString()}
            </div>
          )}
          {status === "completed" && winner && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">Winner:</span>
              <span className="font-medium">{winner}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {participants.toLocaleString()} / {maxParticipants.toLocaleString()} participants
            </span>
          </div>
          {status !== "completed" && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        {electionId ? (
          <Button
            asChild
            className="w-full"
            variant={status === "completed" ? "outline" : "default"}
          >
            <Link
              href={
                status === "completed"
                  ? `/results/${electionId}`
                  : `/election/${electionId}`
              }
            >
              {status === "active" ? "Vote Now" : status === "upcoming" ? "View Details" : "View Results"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            Election unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const { elections: activeElections } = useElections({ status: "active", realtime: true })
  const { elections: upcomingElections } = useElections({ status: ["draft"] })
  const { elections: completedElections } = useElections({ status: "completed" })

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">SecureVote</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#elections" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Elections
            </Link>
            <Link href="/creator-request" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Become a Creator
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {profile?.role === "super_admin" && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">Admin</Link>
                  </Button>
                )}
                {(profile?.role === "election_creator" || profile?.role === "super_admin") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/creator">Dashboard</Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 md:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Trusted by 500+ Organizations
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 text-balance">
              Secure, Transparent Elections for Everyone
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-pretty">
              Run professional elections with complete anonymity, real-time results, and an immutable audit trail. 
              Built for organizations that demand trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">
                  Start Free Election
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href="#how-it-works">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section id="how-it-works" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Built on Trust & Transparency</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Every vote is protected by industry-leading security measures while maintaining complete voter anonymity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <CardTitle>End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-pretty">
                  Your vote is encrypted from the moment you cast it until results are tallied. 
                  Not even administrators can see individual votes.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-7 w-7 text-success" />
                </div>
                <CardTitle>Verifiable Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-pretty">
                  Every election generates a cryptographic proof that allows anyone to verify 
                  the results without compromising voter privacy.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-7 w-7 text-accent" />
                </div>
                <CardTitle>Complete Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-pretty">
                  Every action is logged with timestamps. From election creation to final results, 
                  the entire process is fully auditable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Elections Section */}
      <section id="elections" className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Public Elections</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse current and upcoming elections from verified organizations.
            </p>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="active" className="gap-2">
                  <span className="hidden sm:inline">Active</span>
                  <Badge variant="secondary" className="ml-1">{activeElections.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-2">
                  <span className="hidden sm:inline">Upcoming</span>
                  <Badge variant="secondary" className="ml-1">{upcomingElections.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <span className="hidden sm:inline">Completed</span>
                  <Badge variant="secondary" className="ml-1">{completedElections.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeElections.length === 0 ? (
                  <p className="text-muted-foreground col-span-3 text-center py-8">No active elections right now.</p>
                ) : (
                  activeElections.map((election, index) => (
                    <ElectionCard key={election.id ?? `active-${index}`} election={election} status="active" index={index} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingElections.length === 0 ? (
                  <p className="text-muted-foreground col-span-3 text-center py-8">No upcoming elections.</p>
                ) : (
                  upcomingElections.map((election, index) => (
                    <ElectionCard key={election.id ?? `upcoming-${index}`} election={election} status="upcoming" index={index} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedElections.length === 0 ? (
                  <p className="text-muted-foreground col-span-3 text-center py-8">No completed elections yet.</p>
                ) : (
                  completedElections.map((election, index) => (
                    <ElectionCard key={election.id ?? `completed-${index}`} election={election} status="completed" index={index} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">500+</div>
              <div className="text-primary-foreground/70">Organizations</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">2.5M+</div>
              <div className="text-primary-foreground/70">Votes Cast</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">99.9%</div>
              <div className="text-primary-foreground/70">Uptime</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">0</div>
              <div className="text-primary-foreground/70">Security Breaches</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto text-center p-8 md:p-12 border-2">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Ready to Run Your First Election?</CardTitle>
              <CardDescription className="text-base">
                Join hundreds of organizations that trust SecureVote for their most important decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/creator-request">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Request Creator Access
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Vote className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">SecureVote</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              2026 SecureVote. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
