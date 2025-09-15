"use client";

import BackgroundEffect from "@/components/landing/background-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { useSession } = createAuthClient();

const page = () => {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        name,
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
    <div className="flex h-screen flex-col items-center justify-center py-5">
      <BackgroundEffect />
      <div className="flex w-full flex-col items-center justify-center gap-7">
        <h1 className="font-platypi text-brand-primary text-3xl font-semibold md:text-4xl">
          Venturassist
        </h1>
        <div className="font-dmsans text-brand-secondary mx-auto max-w-lg text-center text-xl md:text-2xl md:leading-8">
          Smart Startup Analysis, Simplified.
        </div>
        <form
          onSubmit={handleSignUp}
          className="flex min-w-1/3 flex-col gap-4 rounded-md bg-white p-5"
        >
          {error && (
            <div className="text-center text-sm text-red-500">{error}</div>
          )}
          <label htmlFor="name" className="font-dmsans text-base font-medium">
            Your Name
          </label>
          <Input
            type="text"
            placeholder="Name"
            className="h-12"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            {isLoading ? "Creating account..." : "Let's Get Started →"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default page;
