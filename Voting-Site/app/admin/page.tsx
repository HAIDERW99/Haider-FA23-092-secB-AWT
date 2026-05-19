"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Shield, Vote, Users, BarChart3, CheckCircle, XCircle, 
  Clock, Building2, Mail, Phone, FileText,
  TrendingUp, AlertCircle, Search, Filter, MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { NavBar } from "@/components/nav-bar"
import type { CreatorRequest } from "@/lib/database.types"

function StatCard({ 
  title, value, description, icon: Icon, trend 
}: { 
  title: string; value: string | number; description: string
  icon: React.ElementType; trend?: { value: number; positive: boolean }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`text-xs flex items-center gap-0.5 ${trend.positive ? "text-success" : "text-destructive"}`}>
              <TrendingUp className={`h-3 w-3 ${!trend.positive && "rotate-180"}`} />
              {trend.value}%
            </span>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RequestDetailsDialog({ 
  request, open, onOpenChange 
}: { 
  request: CreatorRequest | null; open: boolean; onOpenChange: (open: boolean) => void
}) {
  if (!request) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>Review the creator request from {request.organization_name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Applicant</Label>
              <p className="font-medium">{request.first_name} {request.last_name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Reference ID</Label>
              <p className="font-mono text-sm">{request.reference_id}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <p className="text-sm">{request.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </Label>
              <p className="text-sm">{request.phone}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Organization
              </Label>
              <p className="font-medium">{request.organization_name}</p>
              <Badge variant="secondary" className="mt-1">{request.organization_type}</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Expected Voters</Label>
              <p className="text-sm">{request.expected_voters}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3 w-3" /> Purpose
            </Label>
            <p className="text-sm bg-muted/50 rounded-lg p-3">{request.purpose}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3" /> Submitted
            </Label>
            <p className="text-sm">{new Date(request.submitted_at).toLocaleString()}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectionDialog({ 
  request, open, onOpenChange, onReject
}: { 
  request: CreatorRequest | null; open: boolean
  onOpenChange: (open: boolean) => void; onReject: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleReject = async () => {
    setIsLoading(true)
    await onReject(reason)
    setReason("")
    setIsLoading(false)
    onOpenChange(false)
  }

  if (!request) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Reject Request
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting the request from {request.organization_name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Rejection Reason</Label>
          <Textarea
            id="reason"
            placeholder="Please explain why this request is being rejected..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This reason will be sent to the applicant via email.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Rejecting...
              </>
            ) : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboard() {
  const supabase = createBrowserSupabaseClient()
  const { profile, requireRole, isLoading: authLoading } = useAuth()

  const [requests, setRequests] = useState<CreatorRequest[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, activePolls: 0, successRate: 99.7, pendingRequests: 0 })
  const [selectedRequest, setSelectedRequest] = useState<CreatorRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)

  const isAdminReady = !authLoading && profile?.role === "super_admin"

  // Enforce super_admin role
  useEffect(() => {
    requireRole("super_admin")
  }, [requireRole])

  // Fetch pending requests via server API (service role after auth check — avoids RLS/session race)
  const fetchRequests = useCallback(async () => {
    if (!isAdminReady) return

    setIsLoadingRequests(true)
    setFetchError(null)

    try {
      const res = await fetch("/api/admin/creator-requests", {
        credentials: "include",
        cache: "no-store",
      })
      const body = await res.json()

      if (!res.ok) {
        setFetchError(body.error ?? "Failed to load creator requests")
        setRequests([])
        return
      }

      const loaded = (body.requests ?? []) as CreatorRequest[]
      const pendingCount =
        typeof body.pendingCount === "number" ? body.pendingCount : loaded.length
      setRequests(loaded)
      setStats((prev) => ({ ...prev, pendingRequests: pendingCount }))
    } catch {
      setFetchError("Failed to load creator requests")
      setRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }, [isAdminReady])

  // Fetch platform stats (after auth session is ready)
  const fetchStats = useCallback(async () => {
    if (!isAdminReady) return

    const [usersRes, electionsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("elections").select("id", { count: "exact", head: true }).eq("status", "active"),
    ])
    setStats((prev) => ({
      totalUsers: usersRes.count ?? 0,
      activePolls: electionsRes.count ?? 0,
      successRate: 99.7,
      pendingRequests: prev.pendingRequests,
    }))
  }, [supabase, isAdminReady])

  useEffect(() => {
    if (!isAdminReady) return
    fetchRequests()
    fetchStats()
  }, [isAdminReady, fetchRequests, fetchStats])

  // Realtime subscription for new requests
  useEffect(() => {
    if (!isAdminReady) return

    const channel = supabase
      .channel("creator-requests-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "creator_requests" }, () => {
        fetchRequests()
        fetchStats()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, isAdminReady, fetchRequests, fetchStats])

  const handleApprove = async (requestId: string) => {
    if (!profile) return
    setIsApproving(requestId)

    const { data, error } = await (supabase.rpc as any)("approve_creator_request", {
      p_request_id: requestId,
      p_admin_id: profile.id,
    })

    if (error || !data?.success) {
      console.error("Approve error:", error?.message ?? data?.error)
    } else {
      await fetchRequests()
      fetchStats()
    }
    setIsApproving(null)
  }

  const handleReject = async (reason: string) => {
    if (!selectedRequest || !profile) return

    const { data, error } = await (supabase.rpc as any)("reject_creator_request", {
      p_request_id: selectedRequest.id,
      p_admin_id: profile.id,
      p_reason: reason,
    })

    if (error || !data?.success) {
      console.error("Reject error:", error?.message ?? data?.error)
    } else {
      await fetchRequests()
      fetchStats()
    }
  }

  const filteredRequests = requests.filter(
    (req) =>
      `${req.first_name} ${req.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        role={profile?.role ?? null}
        userName={profile?.full_name}
        userEmail={profile?.email}
        actions={
          stats.pendingRequests > 0 ? (
            <Button variant="ghost" size="sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Alerts</span>
              <Badge className="ml-2 bg-destructive text-destructive-foreground">
                {stats.pendingRequests}
              </Badge>
            </Button>
          ) : undefined
        }
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage creator requests and monitor system health</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} description="Registered accounts" icon={Users} trend={{ value: 12, positive: true }} />
          <StatCard title="Active Elections" value={stats.activePolls} description="Currently running" icon={BarChart3} trend={{ value: 8, positive: true }} />
          <StatCard title="Success Rate" value={`${stats.successRate}%`} description="Elections completed" icon={CheckCircle} />
          <StatCard title="Pending Requests" value={stats.pendingRequests} description="Awaiting review" icon={Clock} />
        </div>

        {/* Pending Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Creator Requests</CardTitle>
                <CardDescription>Review and approve election creator applications</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px] md:w-[300px]"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {fetchError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {fetchError}
              </div>
            )}
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No pending requests</h3>
                <p className="text-muted-foreground">All creator requests have been processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Expected Voters</TableHead>
                      <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.first_name} {request.last_name}</p>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{request.organization_name}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{request.organization_type}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{request.expected_voters}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-success hover:bg-success/90 text-success-foreground"
                              onClick={() => handleApprove(request.id)}
                              disabled={isApproving === request.id}
                            >
                              {isApproving === request.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Approve</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => { setSelectedRequest(request); setRejectOpen(true) }}
                            >
                              <XCircle className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedRequest(request); setDetailsOpen(true) }}>
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <RequestDetailsDialog request={selectedRequest} open={detailsOpen} onOpenChange={setDetailsOpen} />
      <RejectionDialog request={selectedRequest} open={rejectOpen} onOpenChange={setRejectOpen} onReject={handleReject} />
    </div>
  )
}
