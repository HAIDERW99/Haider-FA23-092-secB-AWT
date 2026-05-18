"use client"

import { useState } from "react"
import { Shield, Vote, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function SignupPage() {
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const passwordStrength = {
    hasLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const { error: authError } = await signUp(email, password, `${firstName} ${lastName}`)

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
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
            Join the future of secure online voting.
          </h1>
          <p className="text-lg text-primary-foreground/70 text-pretty">
            Create your account to participate in elections or request access to create and manage your own.
          </p>
          <div className="space-y-3">
            {[
              "Vote anonymously with end-to-end encryption",
              "Track all your election participation",
              "Get notified when new elections open",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-foreground/80">
                <CheckCircle className="h-5 w-5 text-primary-foreground/60 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-sm text-primary-foreground/50">
          Trusted by 500+ organizations worldwide
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Vote className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold">SecureVote</span>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Get started with secure, transparent voting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      required
                      autoComplete="given-name"
                      className="h-11"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      required
                      autoComplete="family-name"
                      className="h-11"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      required
                      autoComplete="new-password"
                      className="h-11 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {password && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {[
                        { check: passwordStrength.hasLength, label: "8+ characters" },
                        { check: passwordStrength.hasUppercase, label: "Uppercase" },
                        { check: passwordStrength.hasNumber, label: "Number" },
                        { check: passwordStrength.hasSpecial, label: "Special char" },
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          className={`flex items-center gap-1.5 text-xs ${
                            item.check ? "text-success" : "text-muted-foreground"
                          }`}
                        >
                          <CheckCircle className={`h-3 w-3 ${item.check ? "opacity-100" : "opacity-40"}`} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox id="terms" required className="mt-0.5" />
                  <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
                  </Label>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating account...
                    </div>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            Your data is protected with 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  )
}
