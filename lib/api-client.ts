import { supabase } from "@/lib/supabase"

interface ApiClientOptions extends RequestInit {
  companyId?: string
}

export async function apiClient(url: string, options: ApiClientOptions = {}) {
  const { companyId, ...fetchOptions } = options

  // Get company ID from localStorage if not provided
  let finalCompanyId = companyId
  if (!finalCompanyId) {
    const savedUser = localStorage.getItem("seo-factory-user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      finalCompanyId = user.companyId
    }
  }

  // Add X-Company-Id header for RLS
  const headers = {
    'Content-Type': 'application/json',
    ...(finalCompanyId && { 'X-Company-Id': finalCompanyId }),
    ...fetchOptions.headers,
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  })
}

// Helper for authenticated Supabase calls
export async function authenticatedSupabaseCall<T>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    searchParams?: Record<string, string>
    body?: any
    companyId?: string
  } = {}
) {
  const { method = 'GET', searchParams, body, companyId } = options

  // Get company ID from localStorage if not provided
  let finalCompanyId = companyId
  if (!finalCompanyId) {
    const savedUser = localStorage.getItem("seo-factory-user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      finalCompanyId = user.companyId
    }
  }

  // Build query parameters
  const params = new URLSearchParams()
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      params.append(key, value)
    })
  }

  const url = `/api/${table}${params.toString() ? `?${params.toString()}` : ''}`

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(finalCompanyId && { 'X-Company-Id': finalCompanyId }),
    },
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  return fetch(url, fetchOptions)
}
