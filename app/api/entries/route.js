import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function getJournalId(org_id, journal_code) {
  const { data, error } = await supabaseAdmin
    .from('accounting_journals')
    .select('id')
    .eq('org_id', org_id)
    .eq('code', journal_code)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Journal ${journal_code} introuvable pour org ${org_id}`)
  return data.id
}

async function getAccountId(org_id, code) {
  const { data, error } = await supabaseAdmin
    .from('accounting_accounts')
    .select('id')
    .eq('org_id', org_id)
    .eq('code', code)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Compte ${code} introuvable pour org ${org_id}`)
  return data.id
}

export async function GET(req) {
  const orgId = req?.nextUrl?.searchParams?.get('org_id')

  let query = supabaseAdmin
    .from('accounting_entries')
    .select('id, entry_date, ref, journal:accounting_journals(code)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const flat = (data || []).map(e => ({
    id: e.id,
    entry_date: e.entry_date,
    ref: e.ref,
    journal_code: e.journal?.code,
  }))
  return NextResponse.json(flat)
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { org_id, journal_code, entry_date, ref, lines } = body

    if (!org_id || !journal_code || !entry_date || !lines?.length) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const sumDebit  = lines.reduce((s, l) => s + Number(l.debit || 0), 0)
    const sumCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
    if (Math.abs(sumDebit - sumCredit) > 1e-9) {
      return NextResponse.json({ error: 'Débit ≠ Crédit' }, { status: 400 })
    }

    const journal_id = await getJournalId(org_id, journal_code)

    // Création de l’écriture
    const { data: entry, error: e1 } = await supabaseAdmin
      .from('accounting_entries')
      .insert({ org_id, journal_id, entry_date, ref, meta: { source: 'api' } })
      .select().single()
    if (e1) throw e1

    // Lignes
    const rows = []
    for (const l of lines) {
      const account_id = await getAccountId(org_id, l.account_code)
      rows.push({
        org_id,
        entry_id: entry.id,
        account_id,
        debit: l.debit || 0,
        credit: l.credit || 0,
        currency: l.currency || 'EUR',
        description: l.description || null,
        analytic: l.analytic || null
      })
    }
    const { error: e2 } = await supabaseAdmin.from('accounting_entry_lines').insert(rows)
    if (e2) throw e2

    return NextResponse.json({ id: entry.id })
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 })
  }
}
