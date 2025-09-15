"use client";
import BackgroundEffect from "@/components/landing/background-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const page = () => {
  const router = useRouter();
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
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <BackgroundEffect />
      <div className="flex w-full flex-col items-center justify-center gap-5">
        <div className="font-platypi text-5xl font-semibold text-[#296A86]">
          Welcome back to DealScope
        </div>
        <div className="font-dmsans mx-auto max-w-lg text-center text-2xl leading-8 text-[#C5C5C5]">
          Log in to continue analyzing, exploring, and sharing insights.
        </div>
        <form
          onSubmit={handleSignIn}
          className="flex w-1/3 flex-col gap-4 rounded-md bg-white p-5"
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
            className="h-16 w-full border-2 border-b-4 border-black bg-[#FFC868] text-xl font-medium text-black shadow-sm hover:bg-[#FFC868]/60"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Let's Get Back →"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default page;
