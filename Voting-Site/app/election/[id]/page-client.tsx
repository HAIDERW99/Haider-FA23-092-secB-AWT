"use client"

import { useState, useEffect } from "react"
import { 
  Vote, Shield, Clock, CheckCircle, Users, ArrowRight, 
  Copy, Eye, EyeOff, AlertTriangle, Lock, FileText,
  Fingerprint, ShieldCheck, KeyRound
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { useElection, type ElectionWithCandidates } from "@/hooks/use-elections"
import { Skeleton } from "@/components/ui/skeleton"

const DEFAULT_TERMS = [
  "I confirm that I am an eligible voter for this election.",
  "I understand that my vote is anonymous and cannot be changed once cast.",
  "I agree to participate honestly and not attempt to manipulate the voting process.",
  "I acknowledge that attempting to vote multiple times is prohibited and may result in disqualification.",
]

type ElectionCandidateView = {
  id: string
  name: string
  manifesto: string
  votes: number
}

type ElectionView = {
  id: string
  title: string
  organization: string
  description: string
  endsAt: Date
  totalParticipants: number
  maxParticipants: number
  candidates: ElectionCandidateView[]
  terms: string[]
}

function toElectionView(election: ElectionWithCandidates): ElectionView {
  return {
    id: election.id,
    title: election.title ?? "",
    organization: election.organization ?? "",
    description: election.description ?? "",
    endsAt: election.ends_at ? new Date(election.ends_at) : new Date(),
    totalParticipants: election.registered_count ?? 0,
    maxParticipants: election.max_voters ?? 0,
    candidates: (election.candidates ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? "",
      manifesto: c.manifesto ?? "",
      votes: c.vote_count ?? 0,
    })),
    terms: DEFAULT_TERMS,
  }
}

// Countdown Timer Component — hydration-safe
// Initializes with zeros, then starts ticking only after mount (client-side)
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  function calculateTimeLeft() {
    const difference = targetDate.getTime() - Date.now()
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }

  useEffect(() => {
    // Only run on client — avoids server/client mismatch
    setMounted(true)
    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Render zeros until mounted to match server HTML exactly
  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-4">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="text-center">
            <div className="text-3xl md:text-4xl font-bold font-mono tabular-nums bg-muted/50 rounded-lg px-3 py-2 min-w-[60px]">
              00
            </div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Seconds" },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-3xl md:text-4xl font-bold font-mono tabular-nums bg-muted/50 rounded-lg px-3 py-2 min-w-[60px]">
            {item.value.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

const SECRET_ID_MIN_LENGTH = 12 // POLL-XXXXXXXX

const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Please sign in to join this election.",
  election_not_found: "This election could not be found.",
  election_not_open: "This election is not open for registration.",
  election_ended: "The voting period for this election has ended.",
  election_full: "This election has reached maximum capacity.",
  already_voted: "You have already voted in this election.",
  registration_failed: "Registration failed. Please try again.",
  server_error: "Something went wrong. Please try again.",
}

// Join Election Page Component
function JoinElectionStep({
  election,
  onJoin,
  isJoining,
  joinError,
}: {
  election: ElectionView
  onJoin: () => void
  isJoining: boolean
  joinError: string | null
}) {
  const [acceptedTerms, setAcceptedTerms] = useState<boolean[]>(new Array(election.terms.length).fill(false))
  const allTermsAccepted = acceptedTerms.every(Boolean)

  const handleTermChange = (index: number, checked: boolean) => {
    const newTerms = [...acceptedTerms]
    newTerms[index] = checked
    setAcceptedTerms(newTerms)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Election Info */}
      <Card>
        <CardHeader className="text-center">
          <Badge className="w-fit mx-auto mb-2 bg-success text-success-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Active Election
          </Badge>
          <CardTitle className="text-2xl md:text-3xl text-balance">{election?.title}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            {election?.organization}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">{election?.description}</p>
          
          {/* Countdown */}
          <div className="py-4">
            <p className="text-center text-sm text-muted-foreground mb-3">Voting ends in:</p>
            <CountdownTimer targetDate={election?.endsAt ?? new Date()} />
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 py-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{election.totalParticipants.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Registered Voters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{election.candidates.length}</div>
              <div className="text-sm text-muted-foreground">Candidates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms & Conditions
          </CardTitle>
          <CardDescription>
            Please read and accept all terms to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {election.terms.map((term, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
              <Checkbox
                id={`term-${index}`}
                checked={acceptedTerms[index]}
                onCheckedChange={(checked) => handleTermChange(index, checked as boolean)}
                className="mt-0.5"
              />
              <Label htmlFor={`term-${index}`} className="text-sm leading-relaxed cursor-pointer">
                {term}
              </Label>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {joinError && (
            <div className="flex items-center gap-2 text-sm text-destructive w-full">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {joinError}
            </div>
          )}
          <Button 
            className="w-full" 
            size="lg"
            disabled={!allTermsAccepted || isJoining}
            onClick={onJoin}
          >
            {isJoining ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Registering...
              </>
            ) : (
              <>
                Join Election
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Secret ID Display Component
function SecretIDStep({ secretId, onProceed }: { secretId: string; onProceed: () => void }) {
  const [showFull, setShowFull] = useState(false)
  const [copied, setCopied] = useState(false)

  const maskedId = `****${secretId.slice(-4)}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="border-2 border-accent">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-2xl">Registration Complete</CardTitle>
          <CardDescription>
            Your secret voter ID has been generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Secret ID Card */}
          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Secret ID</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFull(!showFull)}
              >
                {showFull ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Reveal
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl md:text-3xl font-mono font-bold tracking-wider">
                {showFull ? secretId : maskedId}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Important: Save this ID!</p>
                <p className="text-muted-foreground mt-1">
                  This is your only way to verify your vote. It cannot be recovered if lost.
                </p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Your identity is protected by end-to-end encryption
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" onClick={onProceed}>
            Proceed to Voting
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Verification Overlay Component
function VerificationOverlay({
  electionId,
  onVerified,
}: {
  electionId: string
  onVerified: () => void
}) {
  const [enteredId, setEnteredId] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleVerify = async () => {
    setIsVerifying(true)
    setError("")

    // Normalize: trim whitespace + uppercase to match DB storage format
    const normalizedId = enteredId.trim().toUpperCase()

    if (!normalizedId) {
      setError("Please enter your Secret ID.")
      setIsVerifying(false)
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()

      if (!electionId) {
        setError("Invalid election. Return to the home page and try again.")
        setIsVerifying(false)
        return
      }

      console.log("[verify_secret_id_v2] calling RPC with:", {
        p_election_id: electionId,
        p_secret_id: normalizedId,
      })

      const { data, error: rpcError } = await (supabase.rpc as any)("verify_secret_id_v2", {
        p_election_id: electionId,
        p_secret_id: normalizedId,
      })

      // Full debug output — check browser console for this
      console.log("[verify_secret_id_v2] response:", { data, rpcError })

      if (rpcError) {
        console.error("[verify_secret_id_v2] RPC error:", rpcError)
        const rpcMessage =
          rpcError.code === "PGRST202"
            ? "Verification service is unavailable. Ask the election admin to deploy verify_secret_id_v2."
            : "Verification failed. Please try again."
        setError(rpcMessage)
        setIsVerifying(false)
        return
      }

      if (data?.valid) {
        // Store the normalized ID so cast_vote uses the exact same string
        sessionStorage.setItem("sv_secret_id", normalizedId)
        onVerified()
      } else {
        setAttempts(prev => prev + 1)
        const remaining = 3 - attempts - 1
        const attemptSuffix =
          remaining > 0
            ? ` ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : ""
        const reasonMessages: Record<string, string> = {
          already_voted: "You have already voted in this election.",
          not_eligible: "Your registration is not yet finalized.",
          invalid_id: `Secret ID not found.${attemptSuffix}`,
          empty_id: "Please enter your Secret ID.",
          election_not_found: "This election could not be found.",
          election_not_active: "This election is not open for voting.",
          election_ended: "The voting period for this election has ended.",
          server_error: "Verification failed due to a server error. Please try again.",
        }
        const reason =
          reasonMessages[data?.reason as string] ??
          `Invalid Secret ID.${attemptSuffix}`
        setError(reason)
        setEnteredId("")
      }
    } catch (err) {
      console.error("[verify_secret_id_v2] unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const isLocked = attempts >= 3

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
      {/* Security badge pattern background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md relative border-2 border-primary/20 shadow-2xl">
        {/* Top Security Banner */}
        <div className="bg-primary/5 border-b px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Secure Ballot Access</span>
          </div>
        </div>

        <CardHeader className="text-center pt-8">
          <div className="relative mx-auto mb-4">
            {/* Outer ring with animation */}
            <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary/20 animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-2 border-primary/30">
              <Fingerprint className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Identity Verification</CardTitle>
          <CardDescription className="max-w-xs mx-auto">
            Enter your Secret ID to access the secure ballot
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {isLocked ? (
            <div className="bg-destructive/10 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Access Locked</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Too many failed attempts. Please contact election support.
                </p>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Secret ID Input */}
              <div className="space-y-3">
                <Label htmlFor="secretId" className="text-sm flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Secret Voter ID
                </Label>
                <div className="relative">
                  <Input
                    id="secretId"
                    type="text"
                    placeholder="POLL-XXXXXXXX"
                    value={enteredId}
                    onChange={(e) => {
                      setEnteredId(e.target.value.toUpperCase().slice(0, 13))
                      setError("")
                    }}
                    maxLength={13}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && enteredId.length >= SECRET_ID_MIN_LENGTH) {
                        handleVerify()
                      }
                    }}
                    className={`font-mono text-lg tracking-wider h-14 pr-12 ${
                      error ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    disabled={isVerifying}
                    autoFocus
                  />
                  {enteredId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {enteredId.length}/13
                      </Badge>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Security Features */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Security Features Active
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Shield, label: "256-bit Encryption" },
                    { icon: Lock, label: "Session Protected" },
                    { icon: Fingerprint, label: "Biometric Ready" },
                    { icon: ShieldCheck, label: "Audit Logging" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <feature.icon className="h-3.5 w-3.5 text-success" />
                      {feature.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <Button 
                className="w-full h-12" 
                size="lg"
                onClick={handleVerify}
                disabled={enteredId.length < SECRET_ID_MIN_LENGTH || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Verifying Identity...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Verify & Access Ballot
                  </>
                )}
              </Button>

              {/* Attempt Counter */}
              {attempts > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {3 - attempts} verification attempts remaining
                </p>
              )}
            </>
          )}
        </CardContent>

        {/* Bottom Security Footer */}
        <div className="border-t px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              End-to-end encrypted
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Anonymous voting
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Voting Interface Component
function VotingStep({
  election,
  electionId,
  onVote,
}: {
  election: ElectionView
  electionId: string
  onVote: (candidateId: string) => void
}) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCastVote = async () => {
    if (!selectedCandidate) return
    setIsSubmitting(true)
    try {
      const supabase = createBrowserSupabaseClient()
      // Retrieve and normalize — must match exactly what was stored after verification
      const secretId = (sessionStorage.getItem("sv_secret_id") ?? "").trim().toUpperCase()

      if (!electionId) {
        setIsSubmitting(false)
        return
      }

      console.log("[cast_vote] calling RPC with:", {
        p_election_id: electionId,
        p_candidate_id: selectedCandidate,
        p_secret_id: secretId,
      })

      const { data, error } = await (supabase.rpc as any)("cast_vote", {
        p_election_id: electionId,
        p_candidate_id: selectedCandidate,
        p_secret_id: secretId,
      })

      console.log("[cast_vote] response:", { data, error })

      if (error || !data?.success) {
        console.error("[cast_vote] failed:", error?.message ?? data?.error)
        setIsSubmitting(false)
        return
      }
      // Clear secret ID from session after successful vote
      sessionStorage.removeItem("sv_secret_id")
      setIsSubmitting(false)
      setConfirmOpen(false)
      onVote(selectedCandidate)
    } catch (err) {
      console.error("[cast_vote] unexpected error:", err)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with timer */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{election?.title}</h1>
              <p className="text-sm text-muted-foreground">Select your candidate below</p>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="font-mono text-sm">
                Ends in: {Math.floor(((election?.endsAt?.getTime() ?? Date.now()) - Date.now()) / (1000 * 60 * 60))}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates */}
      <RadioGroup value={selectedCandidate || ""} onValueChange={setSelectedCandidate}>
        <div className="space-y-4">
          {(election?.candidates ?? []).map((candidate) => (
            <Card 
              key={candidate.id}
              className={`cursor-pointer transition-all ${
                selectedCandidate === candidate.id 
                  ? "border-accent shadow-md ring-2 ring-accent/20" 
                  : "hover:border-accent/50"
              }`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <RadioGroupItem 
                    value={candidate.id} 
                    id={candidate.id}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {(candidate.name ?? "")
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("") || "?"}
                        </span>
                      </div>
                      <div>
                        <Label htmlFor={candidate.id} className="text-lg font-medium cursor-pointer">
                          {candidate.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {candidate.manifesto}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {/* Cast Vote Button */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Your vote is anonymous and encrypted
            </div>
            <Button 
              size="lg"
              disabled={!selectedCandidate}
              onClick={() => setConfirmOpen(true)}
            >
              <Vote className="mr-2 h-5 w-5" />
              Cast Anonymous Vote
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your vote will be permanently recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">You are voting for:</p>
              <p className="text-lg font-semibold">
                {election?.candidates?.find((c) => c.id === selectedCandidate)?.name}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Go Back
            </Button>
            <Button onClick={handleCastVote} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Casting Vote...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Vote
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Vote Confirmation Component
function VoteConfirmation({
  election,
  candidateId,
}: {
  election: ElectionView
  candidateId: string
}) {
  const candidate = election?.candidates?.find((c) => c.id === candidateId)

  return (
    <div className="max-w-md mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <CardTitle className="text-2xl">Vote Cast Successfully!</CardTitle>
          <CardDescription>
            Your anonymous vote has been securely recorded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">You voted for:</p>
            <p className="text-lg font-semibold">{candidate?.name}</p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 justify-center">
              <Shield className="h-4 w-4 text-success" />
              Your vote is encrypted and anonymous
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Lock className="h-4 w-4 text-success" />
              Recorded in immutable audit log
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Results will be available after the election ends
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/results/${election?.id ?? ""}`}>
                  View Live Results
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ElectionPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

type ElectionClientProps = {
  id: string
  election: ElectionWithCandidates | null
  fetchError?: string | null
}

// Main Election Page Component
export default function ElectionClient({
  id: electionId,
  election: initialElection,
  fetchError,
}: ElectionClientProps) {
  const router = useRouter()
  const { election: liveElection, isLoading, error } = useElection(electionId)
  const electionRecord = liveElection ?? initialElection
  const election = electionRecord ? toElectionView(electionRecord) : null
  const loadError = error ?? fetchError ?? null
  const showLoading = !electionRecord && isLoading && !loadError

  const [step, setStep] = useState<"join" | "secret" | "verify" | "vote" | "confirmed">("join")
  const [secretId, setSecretId] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const handleJoinElection = async () => {
    if (!electionId) return
    setIsJoining(true)
    setJoinError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(`/election/${electionId}`)}`)
        return
      }

      const response = await fetch("/api/elections/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ election_id: electionId }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success || !data?.secret_poll_id) {
        const message =
          REGISTER_ERROR_MESSAGES[data?.error as string] ??
          data?.error ??
          "Registration failed. Please try again."
        setJoinError(message)
        return
      }

      const pollId = String(data.secret_poll_id).trim().toUpperCase()
      setSecretId(pollId)
      sessionStorage.setItem("sv_secret_id", pollId)
      setStep("secret")
    } catch (err) {
      console.error("[register] unexpected error:", err)
      setJoinError(REGISTER_ERROR_MESSAGES.server_error)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Verification Overlay - Shows before ballot access */}
      {step === "verify" && !isVerified && electionId && (
        <VerificationOverlay
          electionId={electionId}
          onVerified={() => {
            setIsVerified(true)
            setStep("vote")
          }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">SecureVote</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Secure Session
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {!electionId ? (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Invalid election link</CardTitle>
              <CardDescription>
                This page needs a valid election ID in the URL.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">Back to elections</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : showLoading ? (
          <ElectionPageSkeleton />
        ) : loadError || (!electionRecord && !isLoading) ? (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Election not found</CardTitle>
              <CardDescription>
                {loadError ?? "We could not load this election. It may have been removed or is not public."}
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">Browse elections</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : !election ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading election details...
          </div>
        ) : (
          <>
            {step === "join" && (
              <JoinElectionStep
                election={election}
                onJoin={handleJoinElection}
                isJoining={isJoining}
                joinError={joinError}
              />
            )}
            {step === "secret" && secretId && (
              <SecretIDStep
                secretId={secretId}
                onProceed={() => {
                  sessionStorage.setItem("sv_secret_id", secretId.trim().toUpperCase())
                  setStep("verify")
                }}
              />
            )}
            {step === "vote" && isVerified && (
              <VotingStep
                election={election}
                electionId={electionId}
                onVote={(candidateId) => {
                  setVotedFor(candidateId)
                  setStep("confirmed")
                }}
              />
            )}
            {step === "confirmed" && votedFor && (
              <VoteConfirmation election={election} candidateId={votedFor} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
