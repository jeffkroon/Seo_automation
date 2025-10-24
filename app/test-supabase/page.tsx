"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestSupabase() {
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  const testConnection = async () => {
    try {
      setStatus("Testing Supabase connection...")
      setError("")
      
      // Test basic connection
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
      
      if (error) {
        setError(`Supabase Error: ${error.message}`)
        setStatus("❌ Connection failed")
      } else {
        setStatus("✅ Supabase connected successfully!")
        console.log("Companies data:", data)
      }
    } catch (err) {
      setError(`Connection Error: ${err}`)
      setStatus("❌ Connection failed")
    }
  }

  const testAuth = async () => {
    try {
      setStatus("Testing Supabase Auth...")
      setError("")
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setError(`Auth Error: ${error.message}`)
        setStatus("❌ Auth failed")
      } else {
        setStatus("✅ Auth works!")
        console.log("Session data:", data)
      }
    } catch (err) {
      setError(`Auth Error: ${err}`)
      setStatus("❌ Auth failed")
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Test Page</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Test Database Connection
        </button>
        
        <button 
          onClick={testAuth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Auth Connection
        </button>
      </div>
      
      <div className="mt-6">
        <div className="font-semibold">Status: {status}</div>
        {error && (
          <div className="text-red-600 mt-2">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Environment Check:</h3>
        <div>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</div>
        <div>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</div>
      </div>
    </div>
  )
}
