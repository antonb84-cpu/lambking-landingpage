import { useEffect, useState } from 'react'
import { counterSelfTest, type SelfTestResult } from '@/data/analytics'

// Nur sichtbar mit ?zaehler-test=1 in der Adresse: zeigt, ob die anonyme Zählung in diesem Browser funktioniert.
export default function CounterSelfTest() {
  const [result, setResult] = useState<SelfTestResult | null>(null)
  useEffect(() => {
    let active = true
    void counterSelfTest().then((value) => {
      if (active) setResult(value)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-2xl border border-border bg-card p-4 text-sm shadow-xl"
    >
      <p className="font-display text-base font-semibold">Zähler-Selbsttest</p>
      {result === null ? (
        <p className="mt-1 text-muted-foreground">Wird geprüft …</p>
      ) : (
        <p className={`mt-1 font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
          {result.ok ? '✓ ' : '✗ '}
          {result.message}
        </p>
      )}
    </div>
  )
}
