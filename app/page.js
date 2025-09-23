'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'

export default function Home() {
  // States
  const [orgId, setOrgId] = useState('')
  const [networkName, setNetworkName] = useState('base')
  const [chainId, setChainId] = useState(8453)
  const [tokenSymbol, setTokenSymbol] = useState('USDC')
  const [decimals, setDecimals] = useState(6)
  const [fromAddr, setFromAddr] = useState('0x donor ...')
  const [toAddr, setToAddr] = useState('0x wallet org ...')
  const [amount, setAmount] = useState('50')
  const [journalCode, setJournalCode] = useState('BQ')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0,10))
  const [ref, setRef] = useState('DON-001')
  const [debitAccount, setDebitAccount] = useState('5121')
  const [creditAccount, setCreditAccount] = useState('706')
  const [currency, setCurrency] = useState('EUR')
  const [reconcileTxId, setReconcileTxId] = useState('')
  const [reconcileEntryId, setReconcileEntryId] = useState('')
  const [period, setPeriod] = useState(new Date().toISOString().slice(0,7))

  const [recentTxs, setRecentTxs] = useState([])
  const [recentEntries, setRecentEntries] = useState([])

  async function refreshLists() {
    const [txRes, enRes] = await Promise.all([
      fetch('/api/transactions/simulate'),
      fetch('/api/entries'),
    ])
    const tx = await txRes.json().catch(()=>[])
    const en = await enRes.json().catch(()=>[])
    setRecentTxs(tx || [])
    setRecentEntries(en || [])
  }

  useEffect(() => { refreshLists() }, [])

  // === Handlers ===
  async function submitSimulateTx(e) {
    e.preventDefault()
    const res = await fetch('/api/transactions/simulate', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ org_id: orgId, network_name: networkName, chain_id: Number(chainId), token_symbol: tokenSymbol, decimals: Number(decimals), from_addr: fromAddr, to_addr: toAddr, amount })
    })
    const j = await res.json()
    if (res.ok) { alert('Transaction simulée'); setReconcileTxId(j?.id || ''); refreshLists() }
    else alert('Erreur: ' + (j?.error || ''))
  }

  async function submitCreateEntry(e) {
    e.preventDefault()
    const res = await fetch('/api/entries', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        org_id: orgId, journal_code: journalCode, entry_date: entryDate, ref,
        lines: [
          { account_code: debitAccount, debit: amount, credit: 0, currency, description: 'Encaissement don' },
          { account_code: creditAccount, debit: 0, credit: amount, currency, description: 'Produit de don' },
        ]
      })
    })
    const j = await res.json()
    if (res.ok) { alert('Écriture créée'); setReconcileEntryId(j?.id || ''); refreshLists() }
    else alert('Erreur: ' + (j?.error || ''))
  }

  async function submitReconcile(e) {
    e.preventDefault()
    const res = await fetch('/api/reconcile', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ org_id: orgId, tx_id: reconcileTxId, entry_id: reconcileEntryId, confidence: 95 })
    })
    const j = await res.json()
    if (res.ok) alert('Réconciliation OK')
    else alert('Erreur: ' + (j?.error || ''))
  }

  async function submitAnchor(e) {
    e.preventDefault()
    const res = await fetch('/api/anchor', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ org_id: orgId, period, network_name: networkName })
    })
    const j = await res.json()
    if (res.ok) alert('Ancrage enregistré')
    else alert('Erreur: ' + (j?.error || ''))
  }

  // === Render ===
  return (
    <div className="space-y-6">
      {/* Paramètres globaux */}
      <Card title="⚙️ Paramètres rapides">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Organisation (org_id)</span>
            <input className="input" value={orgId} onChange={e=>setOrgId(e.target.value)} placeholder="uuid" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Réseau</span>
            <input className="input" value={networkName} onChange={e=>setNetworkName(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Chain ID</span>
            <input className="input" type="number" value={chainId} onChange={e=>setChainId(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Token (symbole)</span>
            <input className="input" value={tokenSymbol} onChange={e=>setTokenSymbol(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Décimales</span>
            <input className="input" type="number" value={decimals} onChange={e=>setDecimals(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Montant</span>
            <input className="input" value={amount} onChange={e=>setAmount(e.target.value)} />
          </label>
        </div>
      </Card>

      {/* Actions principales */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="1️⃣ Simuler une transaction">
          <form className="space-y-3" onSubmit={submitSimulateTx}>
            <label className="flex flex-col">
              <span className="text-sm font-medium">Adresse du donateur</span>
              <input className="input" value={fromAddr} onChange={e=>setFromAddr(e.target.value)} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-medium">Adresse du wallet de l’org</span>
              <input className="input" value={toAddr} onChange={e=>setToAddr(e.target.value)} />
            </label>
            <button className="btn" type="submit">💸 Simuler</button>
          </form>
        </Card>

        <Card title="2️⃣ Créer une écriture comptable">
          <form className="space-y-3" onSubmit={submitCreateEntry}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col">
                <span className="text-sm font-medium">Journal</span>
                <input className="input" value={journalCode} onChange={e=>setJournalCode(e.target.value)} />
              </label>
              <label className="flex flex-col">
                <span className="text-sm font-medium">Date</span>
                <input className="input" type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)} />
              </label>
            </div>
            <label className="flex flex-col">
              <span className="text-sm font-medium">Référence</span>
              <input className="input" value={ref} onChange={e=>setRef(e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col">
                <span className="text-sm font-medium">Compte Débit</span>
                <input className="input" value={debitAccount} onChange={e=>setDebitAccount(e.target.value)} />
              </label>
              <label className="flex flex-col">
                <span className="text-sm font-medium">Compte Crédit</span>
                <input className="input" value={creditAccount} onChange={e=>setCreditAccount(e.target.value)} />
              </label>
            </div>
            <label className="flex flex-col">
              <span className="text-sm font-medium">Devise</span>
              <input className="input" value={currency} onChange={e=>setCurrency(e.target.value)} />
            </label>
            <button className="btn" type="submit">🧾 Enregistrer</button>
          </form>
        </Card>
      </div>

      <Card title="3️⃣ Réconcilier tx ↔ écriture">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitReconcile}>
          <input className="input" placeholder="tx_id" value={reconcileTxId} onChange={e=>setReconcileTxId(e.target.value)} />
          <input className="input" placeholder="entry_id" value={reconcileEntryId} onChange={e=>setReconcileEntryId(e.target.value)} />
          <button className="btn col-span-2" type="submit">🔗 Réconcilier</button>
        </form>
      </Card>

      <Card title="4️⃣ Ancrer une période">
        <form className="flex gap-3" onSubmit={submitAnchor}>
          <input className="input flex-1" value={period} onChange={e=>setPeriod(e.target.value)} />
          <button className="btn" type="submit">⛓️ Ancrer</button>
        </form>
      </Card>

      {/* Résumés */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="🪙 Transactions récentes">
          <ul className="space-y-2">
            {recentTxs.map(t => (
              <li key={t.id} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="text-xs text-gray-500">{t.id}</div>
                <div><b>{t.token_symbol}</b> — {t.amount}</div>
                <div className="text-sm text-gray-600 truncate">{t.from_addr} → {t.to_addr}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="📒 Écritures récentes">
          <ul className="space-y-2">
            {recentEntries.map(e => (
              <li key={e.id} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="text-xs text-gray-500">{e.id}</div>
                <div><b>{e.entry_date}</b> — Ref {e.ref}</div>
                <div className="text-sm text-gray-600">Journal {e.journal_code}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
