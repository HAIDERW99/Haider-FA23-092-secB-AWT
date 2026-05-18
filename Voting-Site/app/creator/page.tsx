"use client"

import { useState, useEffect, useCallback } from "react"
import { Vote, Plus, BarChart3, Users, History, CheckCircle, Hourglass, Lock, Unlock, Trash2, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { NavBar } from "@/components/nav-bar"
import type { Election, Candidate, Registration, AuditLog } from "@/lib/database.types"

type ElectionWithDetails = Election & {
  candidates: Candidate[]
  registrations: Registration[]
  audit_logs: AuditLog[]
}

// ?? Create Election Dialog ????????????????????????????????????????????????
function CreateElectionDialog({
  open, onOpenChange, creatorId, onCreated
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  creatorId: string
  onCreated: () => void
}) {
  const supabase = createBrowserSupabaseClient()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", organization: "",
    startDate: "", startTime: "", endDate: "", endTime: "", maxVoters: "100"
  })
  const [candidates, setCandidates] = useState<{ name: string; manifesto: string }[]>([])
  const [newCandidate, setNewCandidate] = useState({ name: "", manifesto: "" })

  const addCandidate = () => {
    if (newCandidate.name.trim()) {
      setCandidates([...candidates, { ...newCandidate }])
      setNewCandidate({ name: "", manifesto: "" })
    }
  }

  const handleCreate = async () => {
    if (!creatorId) return
    setIsSubmitting(true)
    const startsAt = form.startDate ? new Date(form.startDate + "T" + (form.startTime || "00:00")).toISOString() : null
    const endsAt = form.endDate ? new Date(form.endDate + "T" + (form.endTime || "23:59")).toISOString() : null
    const { data: election, error } = await (supabase.from("elections") as any)
      .insert({ creator_id: creatorId, title: form.title, description: form.description, organization: form.organization, starts_at: startsAt, ends_at: endsAt, max_voters: parseInt(form.maxVoters) || 100 })
      .select().single()
    if (!error && election) {
      if (candidates.length > 0) {
        await (supabase.from("candidates") as any).insert(candidates.map((c, i) => ({ election_id: election.id, name: c.name, manifesto: c.manifesto, position: i })))
      }
      await (supabase.from("audit_logs") as any).insert({ election_id: election.id, actor_id: creatorId, action: "election_created", details: { title: form.title } })
      onCreated()
      onOpenChange(false)
      setStep(1)
      setForm({ title: "", description: "", organization: "", startDate: "", startTime: "", endDate: "", endTime: "", maxVoters: "100" })
      setCandidates([])
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
          <DialogDescription>Step {step} of 3: {step === 1 ? "Basic Information" : step === 2 ? "Schedule & Limits" : "Add Candidates"}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s < step ? "bg-success text-success-foreground" : s === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s < step ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? "bg-success" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Election Title</Label><Input placeholder="e.g., Student Council President 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Provide details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px]" /></div>
            <div className="space-y-2"><Label>Organization</Label><Input placeholder="Your Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Maximum Voters</Label><Input type="number" placeholder="e.g., 2000" value={form.maxVoters} onChange={(e) => setForm({ ...form, maxVoters: e.target.value })} /></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="bg-muted/30">
              <CardHeader className="pb-3"><CardTitle className="text-base">Add Candidate</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Name</Label><Input placeholder="Candidate name" value={newCandidate.name} onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Manifesto</Label><Textarea placeholder="Brief platform description..." value={newCandidate.manifesto} onChange={(e) => setNewCandidate({ ...newCandidate, manifesto: e.target.value })} className="min-h-[80px]" /></div>
                <Button type="button" onClick={addCandidate} disabled={!newCandidate.name.trim()}><Plus className="h-4 w-4 mr-2" />Add Candidate</Button>
              </CardContent>
            </Card>
            {candidates.length > 0 && (
              <div className="space-y-3">
                <Label>Candidates ({candidates.length})</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {candidates.map((c, i) => (
                    <Card key={i} className="relative">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive" onClick={() => setCandidates(candidates.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                      <CardContent className="pt-4"><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground line-clamp-2">{c.manifesto || "No manifesto"}</p></CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Previous</Button>}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !form.title.trim()}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleCreate} disabled={candidates.length < 2 || isSubmitting}>
              {isSubmitting ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Creating...</> : "Create Election"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ?? Main Creator Dashboard ????????????????????????????????????????????????
export default function CreatorDashboard() {
  const supabase = createBrowserSupabaseClient()
  const { profile, requireRole } = useAuth()
  const [elections, setElections] = useState<ElectionWithDetails[]>([])
  const [selected, setSelected] = useState<ElectionWithDetails | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { requireRole(["election_creator", "super_admin"]) }, [requireRole])

  const fetchElections = useCallback(async () => {
    if (!profile) return
    setIsLoading(true)
    const { data } = await supabase
      .from("elections" as any)
      .select("*, candidates(*), registrations(*), audit_logs(*)")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false })
    if (data) {
      setElections(data as ElectionWithDetails[])
      if (data.length > 0) setSelected((prev) => prev ?? data[0] as ElectionWithDetails)
    }
    setIsLoading(false)
  }, [supabase, profile])

  useEffect(() => { fetchElections() }, [fetchElections])

  const handleActivate = async (electionId: string) => {
    await (supabase.from("elections") as any).update({ status: "active" }).eq("id", electionId)
    // Trigger secret ID generation via API route
    await fetch("/api/elections/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_id: electionId }),
    })
    fetchElections()
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        role={profile?.role ?? null}
        userName={profile?.full_name}
        userEmail={profile?.email}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Election</span>
          </Button>
        }
      />
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Elections List */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">My Elections</h2>
                <Badge variant="secondary">{elections.length}</Badge>
              </div>
              <div className="space-y-3">
                {elections.map((election) => (
                  <Card key={election.id} className={`cursor-pointer transition-all hover:border-accent/50 ${selected?.id === election.id ? "border-accent shadow-md" : ""}`} onClick={() => setSelected(election)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium line-clamp-1">{election.title}</h3>
                        <Badge variant={election.status === "active" ? "default" : election.status === "draft" ? "secondary" : "outline"} className={election.status === "active" ? "bg-success text-success-foreground" : ""}>{election.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{election.registered_count}</span>
                        <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{election.votes_cast} votes</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {elections.length === 0 && (
                  <Card className="flex items-center justify-center h-32">
                    <div className="text-center text-muted-foreground"><Vote className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No elections yet</p></div>
                  </Card>
                )}
              </div>
            </div>
            {/* Election Detail */}
            <div className="lg:col-span-2 space-y-6">
              {selected ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <CardTitle className="text-2xl">{selected.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {selected.starts_at ? new Date(selected.starts_at).toLocaleDateString() : "Not set"} - {selected.ends_at ? new Date(selected.ends_at).toLocaleDateString() : "Not set"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {selected.status === "draft" && (
                            <Button size="sm" onClick={() => handleActivate(selected.id)} className="bg-success hover:bg-success/90 text-success-foreground">Activate</Button>
                          )}
                          <Button variant="outline" size="sm" asChild><Link href={`/results/${selected.id}`}><BarChart3 className="h-4 w-4 mr-2" />Results</Link></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-4">
                        {[
                          { label: "Registered", value: selected.registered_count },
                          { label: "Votes Cast", value: selected.votes_cast },
                          { label: "Candidates", value: selected.candidates?.length ?? 0 },
                          { label: "Turnout", value: selected.registered_count > 0 ? `${Math.round((selected.votes_cast / selected.registered_count) * 100)}%` : "0%" },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Tabs defaultValue="voters">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="voters">Voter Management</TabsTrigger>
                      <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    </TabsList>
                    <TabsContent value="voters" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {selected.registered_count >= selected.max_voters ? <Lock className="h-5 w-5 text-destructive" /> : <Unlock className="h-5 w-5 text-success" />}
                            Voter Registration
                          </CardTitle>
                          <CardDescription>{selected.registered_count >= selected.max_voters ? "Registration locked" : "Registration is open"}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Registered Voters</span>
                              <span className="font-medium">{selected.registered_count.toLocaleString()} / {selected.max_voters.toLocaleString()}</span>
                            </div>
                            <Progress value={(selected.registered_count / selected.max_voters) * 100} className="h-3" />
                          </div>
                          {selected.waitlist_count > 0 && (
                            <div className="flex items-center gap-2 text-sm text-amber-600"><Hourglass className="h-4 w-4" /><span>{selected.waitlist_count} voters on waitlist</span></div>
                          )}
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3"><History className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Recent Activity</span></div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {(selected.audit_logs ?? []).slice(0, 10).map((entry, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground text-xs whitespace-nowrap">{new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  <p className="font-medium">{entry.action.replace(/_/g, " ")}</p>
                                </div>
                              ))}
                              {(selected.audit_logs ?? []).length === 0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="candidates" className="mt-4">
                      <Card>
                        <CardHeader><CardTitle className="text-lg">Candidates</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {(selected.candidates ?? []).map((candidate) => (
                              <Card key={candidate.id}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <span className="text-lg font-semibold text-primary">{candidate.name.split(" ").map((n: string) => n[0]).join("")}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium">{candidate.name}</p>
                                      <p className="text-sm text-muted-foreground line-clamp-2">{candidate.manifesto ?? "No manifesto"}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{candidate.vote_count} votes</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {(selected.candidates ?? []).length === 0 && <p className="text-sm text-muted-foreground col-span-2">No candidates added yet</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="flex items-center justify-center h-[400px]">
                  <div className="text-center"><Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" /><p className="text-muted-foreground">Select an election to view details</p></div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
      <CreateElectionDialog open={createOpen} onOpenChange={setCreateOpen} creatorId={profile?.id ?? ""} onCreated={fetchElections} />
    </div>
  )
}