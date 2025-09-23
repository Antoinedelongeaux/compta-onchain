import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req) {
  try {
    const { org_id, tx_id, entry_id, confidence = 90 } = await req.json()
    if (!org_id || !tx_id || !entry_id) {
      return NextResponse.json({ error: 'org_id, tx_id, entry_id requis' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('blockchain_tx_entry_links')
      .insert({ org_id, tx_id, entry_id, confidence })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 })
  }
}
