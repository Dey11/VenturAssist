"use client";
import BackgroundEffect from "@/components/landing/background-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { createAuthClient } from "better-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";

const { useSession } = createAuthClient();

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      // Get the callback URL from search params, default to /startups
      const callbackUrl = searchParams.get("callbackUrl") || "/startups";
      router.push(callbackUrl);
    }
  }, [session, router, searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "An unexpected error occurred");
      } else if (data) {
        // Get the callback URL from search params, default to /startups
        const callbackUrl = searchParams.get("callbackUrl") || "/startups";
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center py-5">
      <BackgroundEffect />
      <div className="flex w-full flex-col items-center justify-center gap-7">
        <h1 className="font-platypi text-brand-primary text-3xl font-semibold md:text-4xl">
          Welcome back to Venturassist
        </h1>
        <div className="font-dmsans text-brand-secondary mx-auto max-w-lg text-center text-xl md:text-2xl md:leading-8">
          Log in to continue analyzing, exploring, and sharing insights.
        </div>
        <form
          onSubmit={handleSignIn}
          className="flex min-w-1/3 flex-col gap-4 rounded-md bg-white p-5"
        >
          {error && (
            <div className="text-center text-sm text-red-500">{error}</div>
          )}
          <label htmlFor="email" className="font-dmsans text-base font-medium">
            Your Email-ID
          </label>
          <Input
            type="email"
            placeholder="Email"
            className="h-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label
            htmlFor="password"
            className="font-dmsans text-base font-medium"
          >
            Password
          </label>
          <Input
            type="password"
            placeholder="Password"
            className="h-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="font-dmsans text-base font-medium text-[#C34B43]">
            Forgot password?
          </div>
          <Button
            type="submit"
            variant="brand"
            className="w-full py-6 text-base font-medium text-black shadow-sm md:py-8 md:text-xl"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Let's Get Back →"}
          </Button>
        </form>
      </div>
    </div>
  );
};

const page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center py-5">
          <BackgroundEffect />
          <div className="flex w-full flex-col items-center justify-center gap-7">
            <h1 className="font-platypi text-brand-primary text-3xl font-semibold md:text-4xl">
              Welcome back to Venturassist
            </h1>
            <div className="font-dmsans text-brand-secondary mx-auto max-w-lg text-center text-xl md:text-2xl md:leading-8">
              Loading...
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
};

export default page;
