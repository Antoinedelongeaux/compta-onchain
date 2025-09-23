import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function tryFetchTable(table) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select()
    .limit(50)
  if (error) {
    const message = error.message || ''
    if (message.includes('does not exist') || message.includes('not exist')) {
      return { data: null }
    }
    throw error
  }
  return { data: data || [] }
}

async function fetchOrgCandidates() {
  const candidates = ['organizations', 'orgs', 'accounting_orgs']
  for (const table of candidates) {
    const { data } = await tryFetchTable(table)
    if (data) {
      return data.map(org => ({
        id: org.id,
        label: org.name || org.legal_name || org.display_name || org.slug || org.code || org.id,
      }))
    }
  }
  return null
}

async function fetchFallbackOrgIds() {
  const tables = ['accounting_entries', 'accounting_entry_lines', 'blockchain_transactions']
  const ids = new Set()
  for (const table of tables) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('org_id')
      .not('org_id', 'is', null)
      .limit(100)
    if (error) {
      const message = error.message || ''
      if (message.includes('does not exist') || message.includes('not exist')) {
        continue
      }
      throw error
    }
    for (const row of data || []) {
      if (row.org_id) ids.add(row.org_id)
    }
  }
  if (ids.size === 0) return null
  return Array.from(ids).map((id, index) => ({
    id,
    label: `Organisation ${index + 1} – ${String(id).slice(0, 8)}…`,
  }))
}

export async function GET() {
  try {
    const direct = await fetchOrgCandidates()
    if (direct?.length) {
      return NextResponse.json(direct)
    }

    const fallback = await fetchFallbackOrgIds()
    if (fallback?.length) {
      return NextResponse.json(fallback)
    }

    return NextResponse.json({ error: 'Aucune organisation disponible' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erreur inconnue' }, { status: 500 })
  }
}
