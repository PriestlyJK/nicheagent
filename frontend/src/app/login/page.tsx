'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')

    try {
      // Dynamic import to avoid SSR issues
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: authError } = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
      } else {
        // Check if onboarding done
        const onboarded = localStorage.getItem('nicheagent_onboarded')
        router.push(onboarded ? '/' : '/onboarding')
      }
    } catch (e) {
      // Fallback: skip auth for now (no Supabase keys)
      localStorage.setItem('nicheagent_user', JSON.stringify({ email }))
      const onboarded = localStorage.getItem('nicheagent_onboarded')
      router.push(onboarded ? '/' : '/onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      className="min-h-screen bg-[#F2F0EB] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-[32px] h-[32px] bg-[#0f0f0f] rounded-[8px] flex items-center justify-center">
            <Radio size={16} className="text-white" />
          </div>
          <span className="text-[20px] font-black tracking-tight text-[#0f0f0f]">NicheAgent</span>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl px-6 py-8">
          <h1 className="text-[20px] font-black text-[#0f0f0f] mb-1">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-[13px] text-neutral-500 font-semibold mb-6">
            {isSignup ? 'Start discovering startup opportunities' : 'Sign in to your account'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full mt-1 px-3 py-2.5 text-[14px] bg-white border border-black/12 rounded-lg text-[#0f0f0f] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2.5 text-[14px] bg-white border border-black/12 rounded-lg text-[#0f0f0f] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] transition-colors"
              />
            </div>

            {error && (
              <p className="text-[12px] font-bold text-[#A32D2D] bg-[#FCEBEB] rounded-lg px-3 py-2">{error}</p>
            )}

            <button onClick={handleSubmit} disabled={loading || !email || !password}
              className="w-full py-3 bg-[#0f0f0f] text-white rounded-xl text-[14px] font-black
                         hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin"/> Please wait…</> :
               isSignup ? 'Create account →' : 'Sign in →'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-black/8 text-center">
            <button onClick={() => setIsSignup(s => !s)}
              className="text-[13px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-neutral-400 mt-4">
          AI-powered startup niche discovery
        </p>
      </div>
    </div>
  )
}
