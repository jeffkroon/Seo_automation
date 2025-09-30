const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set. Configure it in your environment.')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Configure it in your environment.')
}

type RestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  searchParams?: Record<string, string | number | boolean | undefined>
  body?: Record<string, unknown> | null
  prefer?: string
}

export async function supabaseRest<T = any>(
  path: string,
  { method = 'GET', headers = {}, searchParams, body = null, prefer }: RestOptions = {},
): Promise<T> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`)

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) return
      url.searchParams.set(key, String(value))
    })
  }

  const requestHeaders: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...headers,
  }

  if (prefer) {
    requestHeaders.Prefer = prefer
  }

  const response = await fetch(url.toString(), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Supabase request failed (${response.status}): ${text}`)
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}
