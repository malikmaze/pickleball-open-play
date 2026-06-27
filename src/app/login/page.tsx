"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsSubmitting(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell withNav={false}>
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <Card className="w-full max-w-md rounded-3xl border-2 border-black/10 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sisclub-pink-soft">
              <LogIn className="h-6 w-6 text-sisclub-green" />
            </div>
            <CardTitle className="font-heading text-2xl text-sisclub-green-dark">
              Organizer Login
            </CardTitle>
            <CardDescription>
              Sign in with your admin account to manage sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError && (
              <p className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                Authentication failed. Please try again.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="organizer@sisclub.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-black/10"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-black/10"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border-2 border-black/10 bg-sisclub-green font-bold text-white shadow-sm transition-all hover:bg-sisclub-green-dark hover:shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
