import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

export async function POST(req) {
  try {
    const { org_id, period, network_name } = await req.json()
    if (!org_id || !period) return NextResponse.json({ error: 'org_id et period requis' }, { status: 400 })
    // Période attendue "YYYY-MM"
    const [y, m] = period.split('-')
    const start = `${y}-${m}-01`
    const end   = new Date(+y, +m, 1).toISOString().slice(0,10) // 1er du mois suivant

    // Récupérer les écritures de la période
    const { data: entries, error: e1 } = await supabaseAdmin
      .from('accounting_entries')
      .select('id, entry_date, ref, org_id')
      .eq('org_id', org_id)
      .gte('entry_date', start)
      .lt('entry_date', end)
      .order('entry_date', { ascending: true })
    if (e1) throw e1

    // Merkle "simple" (MVP) : concat des hash de chaque ligne JSON triée
    const leafHashes = (entries || []).map(e => sha256Hex(JSON.stringify(e)))
    const root = sha256Hex(leafHashes.join(''))

    // Trouver network_id si fourni (facultatif)
    let network_id = null
    if (network_name) {
      const { data: net, error: en } = await supabaseAdmin
        .from('blockchain_networks')
        .select('id').eq('name', network_name).maybeSingle()
      if (en) throw en
      network_id = net?.id || null
    }

    // Enregistrement de l'ancrage (tx hash simulée)
    const { error: e2 } = await supabaseAdmin
      .from('blockchain_period_anchors')
      .insert({
        org_id,
        period,
        merkle_root: root,     // colonne TEXT recommandée pour MVP
        ipfs_cid: `sim_cid_${crypto.randomUUID()}`,
        network_id,
        anchor_tx_hash: `sim_anchor_${crypto.randomUUID()}`,
      })
    if (e2) throw e2

    return NextResponse.json({ ok: true, root, count: entries?.length || 0 })
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 })
  }
}
