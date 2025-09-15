'use client'
import BackgroundEffect from '@/components/background-effect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const page = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      })

      if (error) {
        setError(error.message || "An unexpected error occurred")
      } else if (data) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <BackgroundEffect/>
      <div className='flex flex-col items-center justify-center gap-5 w-full'>
        <div className='text-5xl font-platypi text-[#296A86] font-semibold'>Welcome back to DealScope</div>
        <div className='text-2xl font-dmsans text-[#C5C5C5] max-w-lg mx-auto text-center leading-8'>Log in to continue analyzing, exploring, and sharing insights.</div>
        <form onSubmit={handleSignIn} className='p-5 rounded-md flex flex-col gap-4 w-1/3 bg-white'>
          {error && (
            <div className='text-red-500 text-sm text-center'>{error}</div>
          )}
          <label htmlFor='email' className='text-base font-dmsans font-medium'>Your Email-ID</label>
          <Input 
            type='email' 
            placeholder='Email' 
            className='h-12'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor='password' className='text-base font-dmsans font-medium'>Password</label>
          <Input 
            type='password' 
            placeholder='Password' 
            className='h-12'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className='text-base font-dmsans font-medium text-[#C34B43]'>Forgot password?</div>
          <Button 
            type="submit"
            className="h-16 bg-[#FFC868] text-black font-medium  border-2 border-b-4 text-xl border-black shadow-sm w-full  hover:bg-[#FFC868]/60"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : "Let's Get Back →"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default page
