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
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        name,
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
      <div className='flex flex-col items-center justify-center gap-10 w-full'>
        <div className='text-5xl font-platypi text-[#296A86] font-semibold'>DealScope</div>
        <div className='text-2xl font-dmsans text-[#C5C5C5] max-w-lg mx-auto text-center leading-8'>Smart Startup Analysis, Simplified.</div>
        <form onSubmit={handleSignUp} className='p-5 rounded-md flex flex-col gap-4 min-w-1/3 bg-white'>
          {error && (
            <div className='text-red-500 text-sm text-center'>{error}</div>
          )}
          <label htmlFor='name' className='text-base font-dmsans font-medium'>Your Name</label>
          <Input 
            type='text' 
            placeholder='Name' 
            className='h-12'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            {isLoading ? 'Creating account...' : "Let's Get Started →"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default page
