"use client"

import { useState } from "react"
import { Shield, Vote, Building2, Mail, Phone, FileText, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function CreatorRequestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [referenceId, setReferenceId] = useState("")
  const [error, setError] = useState("")

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    type: "",
    purpose: "",
    voters: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/creator-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          organization_name: form.organization,
          organization_type: form.type,
          purpose: form.purpose,
          expected_voters: form.voters,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? "Failed to submit request")
        setIsLoading(false)
        return
      }

      setReferenceId(body.reference_id ?? "")
      setIsSubmitted(true)
    } catch {
      setError("Failed to submit request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Request Submitted</CardTitle>
            <CardDescription className="text-base">
              Your election creator request has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-pretty">
              Our team will review your application within 2-3 business days. 
              You&apos;ll receive an email notification once your request has been processed.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Reference ID:</strong> {referenceId}
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Vote className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold text-primary-foreground">SecureVote</span>
          </Link>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground text-balance">
            Become an Election Creator
          </h1>
          <p className="text-lg text-primary-foreground/70 text-pretty">
            Request access to create and manage elections for your organization. 
            All requests are reviewed by our admin team.
          </p>
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider">
              What You Can Do as a Creator
            </h3>
            {[
              { icon: Building2, text: "Create unlimited elections for your organization" },
              { icon: Shield, text: "Set up secure voter eligibility rules" },
              { icon: FileText, text: "Access detailed analytics and audit logs" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-primary-foreground/80">
                <item.icon className="h-5 w-5 text-primary-foreground/60 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-sm text-primary-foreground/50">
          Average approval time: 1-2 business days
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-lg space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to home</span>
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Vote className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold">SecureVote</span>
            </div>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Creator Request Form</CardTitle>
              <CardDescription>
                Provide your organization details for admin review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        required
                        className="h-11"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        required
                        className="h-11"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@organization.com"
                        required
                        className="h-11 pl-10"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        required
                        className="h-11 pl-10"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Organization Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organization"
                        placeholder="Your Organization Inc."
                        required
                        className="h-11 pl-10"
                        value={form.organization}
                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Organization type</Label>
                    <Select required onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educational">Educational Institution</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit Organization</SelectItem>
                        <SelectItem value="corporate">Corporate / Business</SelectItem>
                        <SelectItem value="government">Government / Municipal</SelectItem>
                        <SelectItem value="association">Professional Association</SelectItem>
                        <SelectItem value="community">Community Group / HOA</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of elections</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Describe what types of elections you plan to conduct and the approximate number of voters..."
                      required
                      className="min-h-[120px] resize-none"
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voters">Expected number of voters</Label>
                    <Select required onValueChange={(v) => setForm({ ...form, voters: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Less than 100">Less than 100</SelectItem>
                        <SelectItem value="100 - 500">100 - 500</SelectItem>
                        <SelectItem value="500 - 2,000">500 - 2,000</SelectItem>
                        <SelectItem value="2,000 - 10,000">2,000 - 10,000</SelectItem>
                        <SelectItem value="10,000+">10,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting request...
                    </div>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            By submitting, you confirm this information is accurate. False information may result in rejection.
          </p>
        </div>
      </div>
    </div>
  )
}
