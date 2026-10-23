import { Wordmark } from '@/components/ui/fiqr/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-background px-5 pb-8" style={{ paddingTop: 'calc(32px + var(--safe-top))' }}>
      <div className="w-full max-w-sm">
        <Wordmark />
        <div className="mt-12">{children}</div>
      </div>
    </div>
  )
}
