import { Suspense } from "react"
import { EmailConfirm } from "@/components/auth/email-confirm"

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Email Verificatie</h1>
          <p className="text-slate-600">Bevestig je email adres</p>
        </div>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <EmailConfirm />
        </Suspense>
      </div>
    </div>
  )
}
