/**
 * Database Webhook → Expo Push for new visitor_requests.
 * Service role stays here — never in the Expo client.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const ANDROID_CHANNEL_ID = 'portl'

type VisitorRecord = {
  id?: string
  flat_id?: string
  visitor_name?: string
  visitor_type?: string
}

type WebhookPayload = {
  type?: string
  table?: string
  record?: VisitorRecord
  /** Some webhook configs nest under `payload` */
  payload?: { record?: VisitorRecord }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function extractRecord(body: WebhookPayload): VisitorRecord | null {
  if (body?.record && typeof body.record === 'object') return body.record
  if (body?.payload?.record && typeof body.payload.record === 'object') {
    return body.payload.record
  }
  // Bare `{ record }` already covered; also accept a raw visitor row
  if (body && 'flat_id' in body && 'id' in body) {
    return body as unknown as VisitorRecord
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      500,
    )
  }

  let body: WebhookPayload
  try {
    body = (await req.json()) as WebhookPayload
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const record = extractRecord(body)
  if (!record?.id || !record.flat_id) {
    return json({ error: 'Missing record.id or record.flat_id', sent: 0, tokens: 0 }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('flat_id', record.flat_id)
    .eq('role', 'resident')
    .eq('status', 'approved')

  if (membershipsError) {
    return json({ error: membershipsError.message, sent: 0, tokens: 0 }, 500)
  }

  const userIds = [
    ...new Set(
      (memberships ?? [])
        .map((m) => m.user_id as string)
        .filter(Boolean),
    ),
  ]

  if (userIds.length === 0) {
    return json({ sent: 0, tokens: 0, reason: 'no_approved_residents' })
  }

  const { data: tokenRows, error: tokensError } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds)

  if (tokensError) {
    return json({ error: tokensError.message, sent: 0, tokens: 0 }, 500)
  }

  const tokens = [
    ...new Set(
      (tokenRows ?? [])
        .map((t) => t.expo_push_token as string)
        .filter(Boolean),
    ),
  ]

  if (tokens.length === 0) {
    return json({ sent: 0, tokens: 0, reason: 'no_push_tokens' })
  }

  const visitorName = record.visitor_name?.trim() || 'Visitor'
  const visitorType = record.visitor_type?.trim() || 'guest'
  const messages = tokens.map((to) => ({
    to,
    title: 'Visitor waiting',
    body: `${visitorName} (${visitorType}) is at the gate`,
    data: {
      visitorRequestId: record.id,
      flatId: record.flat_id,
    },
    channelId: ANDROID_CHANNEL_ID,
  }))

  const expoHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  }
  // Optional — set via `supabase secrets set EXPO_ACCESS_TOKEN=...` if you use Expo push credentials
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN')
  if (expoAccessToken) {
    expoHeaders.Authorization = `Bearer ${expoAccessToken}`
  }

  const pushRes = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: expoHeaders,
    body: JSON.stringify(messages),
  })

  const pushBody = await pushRes.text()
  if (!pushRes.ok) {
    return json(
      {
        error: 'Expo Push API error',
        status: pushRes.status,
        detail: pushBody,
        sent: 0,
        tokens: tokens.length,
      },
      502,
    )
  }

  return json({
    sent: messages.length,
    tokens: tokens.length,
  })
})
