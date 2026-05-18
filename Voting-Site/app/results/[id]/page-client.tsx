"use client"

import { useState, useEffect } from "react"
import { 
  Vote, Shield, Trophy, Users, BarChart3, Clock, 
  CheckCircle, TrendingUp, History, Download, Share2,
  AlertTriangle, Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast, Toaster } from "sonner"
import { useElection } from "@/hooks/use-elections"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  Pie,
  PieChart,
} from "recharts"

// Mock election results data
const electionResults = {
  id: "1",
  title: "Student Council President 2026",
  organization: "National University",
  status: "completed" as const,
  startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  totalEligible: 2000,
  totalVotes: 1523,
  candidates: [
    { id: "c1", name: "Alice Johnson", votes: 612, percentage: 40.2 },
    { id: "c2", name: "Bob Smith", votes: 401, percentage: 26.3 },
    { id: "c3", name: "Carol Williams", votes: 298, percentage: 19.6 },
    { id: "c4", name: "David Brown", votes: 212, percentage: 13.9 },
  ],
}

// Audit log for transparency
const auditLog = [
  { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), action: "Election Ended", details: "Voting period concluded", type: "system" as const },
  { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 - 5 * 60 * 1000), action: "Final Vote Cast", details: "Anonymous ballot #1523", type: "system" as const },
  { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), action: "Results Verified", details: "Cryptographic verification complete", type: "system" as const },
  { timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), action: "Election Started", details: "Voting period began", type: "system" as const },
  { timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000), action: "Candidates Finalized", details: "4 candidates approved", type: "system" as const },
  { timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), action: "Election Created", details: "Student Council President 2026", type: "system" as const },
]

// Admin override audit log
const adminOverrideLog = [
  { 
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 
    admin: "admin@university.edu",
    action: "Max Voters Increased", 
    before: "1500",
    after: "2000",
    reason: "High registration demand exceeded initial capacity"
  },
  { 
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 
    admin: "admin@university.edu",
    action: "Voting Period Extended", 
    before: "5 days",
    after: "7 days",
    reason: "Extended due to technical difficulties on day 2"
  },
  { 
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 
    admin: "admin@university.edu",
    action: "Candidate Added", 
    before: "3 candidates",
    after: "4 candidates",
    reason: "Late submission approved by election committee"
  },
]

// Chart colors
const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
]

// Turnout Doughnut Chart Component
function TurnoutDoughnutChart({ voted, total }: { voted: number; total: number }) {
  const turnoutPercent = ((voted / total) * 100).toFixed(1)
  const didNotVote = total - voted
  
  const data = [
    { name: "Voted", value: voted, fill: "hsl(var(--success))" },
    { name: "Did Not Vote", value: didNotVote, fill: "hsl(var(--muted))" },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Voter Turnout
        </CardTitle>
        <CardDescription>Participation rate analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value.toLocaleString()} voters
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold">{turnoutPercent}%</p>
              <p className="text-xs text-muted-foreground">Turnout</p>
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm">{voted.toLocaleString()} Voted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-sm">{didNotVote.toLocaleString()} Abstained</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Admin Override Audit Table Component
function AdminOverrideTable({ overrides }: { overrides: typeof adminOverrideLog }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Admin Override Audit Trail
        </CardTitle>
        <CardDescription>Complete log of all administrative changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
                <TableHead className="w-[120px]">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((override, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">
                    <div>{override.timestamp.toLocaleDateString()}</div>
                    <div className="text-muted-foreground">
                      {override.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">{override.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground line-through">{override.before}</span>
                      <span className="text-muted-foreground">{"→"}</span>
                      <span className="font-medium text-success">{override.after}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px]">
                    <p className="text-sm text-muted-foreground truncate" title={override.reason}>
                      {override.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">
                      {override.admin.split('@')[0]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          All admin overrides are cryptographically signed and immutable
        </p>
      </CardContent>
    </Card>
  )
}

// Winner Card Component
function WinnerCard({ candidate, totalVotes }: { candidate: typeof electionResults.candidates[0]; totalVotes: number }) {
  return (
    <Card className="border-2 border-success bg-success/5">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-success flex items-center justify-center">
              <Trophy className="h-5 w-5 text-success-foreground" />
            </div>
          </div>
          <Badge className="bg-success text-success-foreground mb-2">Winner</Badge>
          <h3 className="text-2xl font-bold">{candidate.name}</h3>
          <div className="mt-2 space-y-1">
            <p className="text-3xl font-bold text-success">{candidate.votes.toLocaleString()}</p>
            <p className="text-muted-foreground">votes ({candidate.percentage}%)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Results Bar Chart Component
function ResultsChart({ candidates }: { candidates: typeof electionResults.candidates }) {
  const chartData = candidates.map((c, i) => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    votes: c.votes,
    percentage: c.percentage,
    fill: chartColors[i % chartColors.length],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Vote Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.votes.toLocaleString()} votes ({data.percentage}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Progress Results Component
function ProgressResults({ candidates }: { candidates: typeof electionResults.candidates }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detailed Results</CardTitle>
        <CardDescription>Vote breakdown by candidate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {candidates.map((candidate, index) => (
          <div key={candidate.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{candidate.name}</p>
                  {index === 0 && (
                    <Badge variant="outline" className="text-xs text-success border-success">
                      Winner
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{candidate.votes.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{candidate.percentage}%</p>
              </div>
            </div>
            <Progress 
              value={candidate.percentage} 
              className="h-3"
              style={{
                // @ts-expect-error CSS custom property
                "--progress-color": chartColors[index % chartColors.length],
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Transparency Sidebar Component
function TransparencySidebar({ auditLog }: { auditLog: Array<{ timestamp: Date; action: string; details: string; type: string }> }) {
  return (
    <Card className="h-fit lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Transparency Log
        </CardTitle>
        <CardDescription>Complete audit trail</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {auditLog.map((entry: { timestamp: Date; action: string; details: string; type: string }, index: number) => (
            <div key={index} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
                {index < auditLog.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="font-medium">{entry.action}</p>
                <p className="text-muted-foreground text-xs">{entry.details}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {entry.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Stats Cards Component (more compact)
function StatsCards({ results }: { results: typeof electionResults }) {
  const turnout = ((results.totalVotes / results.totalEligible) * 100).toFixed(1)

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{turnout}%</p>
            <p className="text-xs text-muted-foreground">Turnout</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{results.totalVotes.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Votes Cast</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{results.totalEligible.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Eligible</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Vote className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{results.candidates.length}</p>
            <p className="text-xs text-muted-foreground">Candidates</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

type ElectionResultsView = {
  id: string
  title: string
  organization: string
  status: "completed" | "active"
  startedAt: Date
  endedAt: Date
  totalEligible: number
  totalVotes: number
  candidates: Array<{
    id: string
    name: string
    votes: number
    percentage: number
  }>
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildResultsCsv(results: ElectionResultsView): string {
  const turnout =
    results.totalEligible > 0
      ? ((results.totalVotes / results.totalEligible) * 100).toFixed(1)
      : "0"

  return [
    "Election Results Export",
    `Title,${escapeCsv(results.title)}`,
    `Organization,${escapeCsv(results.organization)}`,
    `Status,${results.status}`,
    `Started,${results.startedAt.toLocaleDateString()}`,
    `Ended,${results.endedAt.toLocaleDateString()}`,
    `Total Eligible,${results.totalEligible}`,
    `Votes Cast,${results.totalVotes}`,
    `Turnout %,${turnout}`,
    "",
    "Rank,Candidate,Votes,Percentage",
    ...results.candidates.map((c, i) =>
      `${i + 1},${escapeCsv(c.name)},${c.votes},${c.percentage}%`
    ),
  ].join("\n")
}

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function slugifyTitle(title: string): string {
  const slug = title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
  return slug || "election"
}

// Loading Skeleton
function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[200px] rounded-lg" />
          <Skeleton className="h-[350px] rounded-lg" />
        </div>
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const params = useParams()
  const electionId = typeof params.id === "string" ? params.id : ""
  const { election, isLoading } = useElection(electionId)
  const electionResults = election ? {
    id: election.id,
    title: election.title,
    organization: election.organization,
    status: (election.status === "completed" ? "completed" : "active") as "completed",
    startedAt: election.starts_at ? new Date(election.starts_at) : new Date(),
    endedAt: election.ends_at ? new Date(election.ends_at) : new Date(),
    totalEligible: election.max_voters,
    totalVotes: election.votes_cast,
    candidates: (election.candidates ?? []).map((c, i) => ({
      id: c.id,
      name: c.name,
      votes: c.vote_count,
      percentage: election.votes_cast > 0 ? parseFloat(((c.vote_count / election.votes_cast) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.votes - a.votes),
  } : null

  const winner = electionResults ? electionResults.candidates[0] : undefined

  const handleExport = () => {
    if (!electionResults) {
      toast.error("Results are still loading")
      return
    }

    const csv = buildResultsCsv(electionResults)
    const filename = `${slugifyTitle(electionResults.title)}-results.csv`
    downloadTextFile(csv, filename, "text/csv;charset=utf-8")
    toast.success("Results downloaded")
  }

  const handleShare = async () => {
    if (!electionResults) {
      toast.error("Results are still loading")
      return
    }

    const url = window.location.href
    const sharePayload = {
      title: `${electionResults.title} — SecureVote Results`,
      text: `Election results for ${electionResults.title} (${electionResults.organization})`,
      url,
    }

    try {
      if (typeof navigator.share === "function") {
        if (!navigator.canShare || navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload)
          return
        }
      }

      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return
      }

      try {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard")
      } catch {
        toast.error("Could not share. Copy the URL from your address bar.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">SecureVote</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!electionResults}
              aria-label="Export results as CSV"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={!electionResults}
              aria-label="Share results link"
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={electionResults?.status === "completed" ? "outline" : "default"}>
                  {electionResults?.status === "completed" ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Live
                    </>
                  )}
                </Badge>
                <Badge variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{electionResults?.title ?? "Loading..."}</h1>
              <p className="text-muted-foreground mt-1">{electionResults?.organization}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Started: {electionResults?.startedAt.toLocaleDateString()}</p>
              <p>Ended: {electionResults?.endedAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {isLoading || !electionResults ? (
          <ResultsSkeleton />
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            {electionResults && <StatsCards results={electionResults} />}

            {/* Main Content - 3 columns */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Winner & Charts */}
              <div className="lg:col-span-2 space-y-6">
                {/* Winner & Turnout Row */}
                <div className="grid gap-6 md:grid-cols-2">
                  {winner && electionResults && <WinnerCard candidate={winner} totalVotes={electionResults.totalVotes} />}
                  {electionResults && <TurnoutDoughnutChart voted={electionResults.totalVotes} total={electionResults.totalEligible} />}
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 md:grid-cols-2">
                  {electionResults && <ResultsChart candidates={electionResults.candidates} />}
                  {electionResults && <ProgressResults candidates={electionResults.candidates} />}
                </div>

                {/* Admin Override Audit Table */}
                <AdminOverrideTable overrides={adminOverrideLog} />
              </div>

              {/* Right Column - Transparency */}
              <div>
                <TransparencySidebar auditLog={auditLog} />
              </div>
            </div>
          </div>
        )}
      </main>
      <Toaster richColors position="top-center" />
    </div>
  )
}
