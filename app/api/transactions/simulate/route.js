import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Helper: upsert réseau & token (par nom/symbole)
async function ensureNetworkAndToken({ chain_id, network_name, token_symbol, decimals }) {
  // Réseau
  let { data: net, error: e1 } = await supabaseAdmin
    .from('blockchain_networks')
    .select('*').eq('chain_id', chain_id).maybeSingle()
  if (e1) throw e1
  if (!net) {
    const { data, error } = await supabaseAdmin
      .from('blockchain_networks')
      .insert({ name: network_name, chain_id }).select().single()
    if (error) throw error
    net = data
  }

  // Token
  let { data: tok, error: e2 } = await supabaseAdmin
    .from('blockchain_tokens')
    .select('*')
    .eq('network_id', net.id)
    .eq('symbol', token_symbol)
    .maybeSingle()
  if (e2) throw e2
  if (!tok) {
    const { data, error } = await supabaseAdmin
      .from('blockchain_tokens')
      .insert({ network_id: net.id, symbol: token_symbol, decimals })
      .select().single()
    if (error) throw error
    tok = data
  }
  return { network: net, token: tok }
}

export async function GET(req) {
  const orgId = req?.nextUrl?.searchParams?.get('org_id')

  let query = supabaseAdmin
    .from('blockchain_transactions')
    .select('id, amount, from_addr, to_addr, block_time, status, token:blockchain_tokens(symbol), network:blockchain_networks(name)')
    .order('block_time', { ascending: false })
    .limit(10)

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const flat = (data || []).map(d => ({
    id: d.id,
    amount: d.amount,
    from_addr: d.from_addr,
    to_addr: d.to_addr,
    block_time: d.block_time,
    status: d.status,
    token_symbol: d.token?.symbol ?? 'N/A',
    network_name: d.network?.name ?? null,
  }))
  return NextResponse.json(flat)
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { org_id, network_name, chain_id, token_symbol, decimals, from_addr, to_addr, amount } = body

    if (!org_id) return NextResponse.json({ error: 'org_id manquant' }, { status: 400 })

    const { network, token } = await ensureNetworkAndToken({ chain_id, network_name, token_symbol, decimals })

    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('blockchain_transactions')
      .insert({
        org_id,
        network_id: network.id,
        tx_hash: `sim_${crypto.randomUUID()}`,
        from_addr,
        to_addr,
        token_id: token.id,
        amount: amount.toString(),
        block_number: Math.floor(Date.now() / 1000),
        block_time: now,
        status: 'confirmed',
        meta: { simulated: true }
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 })
  }
}
