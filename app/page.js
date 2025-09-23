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
    <div className="space-y-12">
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card
          title={(
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Paramétrage initial</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Identité & réseau d’orchestration</h2>
                <p className="mt-3 max-w-xl text-sm text-slate-300/80">
                  Centralisez vos réglages clés pour alimenter l’ensemble du workflow : ils seront appliqués pour chaque action
                  (simulation, écriture, réconciliation et ancrage).
                </p>
              </div>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">⚙️</span>
            </div>
          )}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Organisation (org_id)</span>
              <input className="input" value={orgId} onChange={e => setOrgId(e.target.value)} placeholder="uuid" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Réseau</span>
              <input className="input" value={networkName} onChange={e => setNetworkName(e.target.value)} placeholder="ex. base" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Chain ID</span>
              <input className="input" type="number" value={chainId} onChange={e => setChainId(e.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Token (symbole)</span>
              <input className="input" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} placeholder="USDC" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Décimales</span>
              <input className="input" type="number" value={decimals} onChange={e => setDecimals(e.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Montant cible</span>
              <input className="input" value={amount} onChange={e => setAmount(e.target.value)} />
            </label>
          </div>
        </Card>

        <Card
          title={(
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Vision synthétique</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Aperçu en temps réel</h2>
              <p className="mt-3 text-sm text-slate-300/80">
                Visualisez instantanément vos paramètres actifs et suivez les jalons du parcours comptable.
              </p>
            </div>
          )}
        >
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Montant simulé</p>
                <p className="mt-3 flex items-baseline gap-2 text-2xl font-semibold text-white">
                  {amount || '—'}
                  <span className="text-base font-medium text-emerald-200">{tokenSymbol}</span>
                </p>
                <p className="mt-2 text-xs text-slate-300/70">Token {tokenSymbol} — {decimals} décimales</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Période à ancrer</p>
                <p className="mt-3 text-2xl font-semibold text-white">{period || '—'}</p>
                <p className="mt-2 text-xs text-slate-300/70">Réseau {networkName || '—'} • Chain ID {chainId || '—'}</p>
              </div>
            </div>
            <ol className="space-y-4 text-sm text-slate-300/80">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-200">1</span>
                <div>
                  <p className="font-medium text-white">Simuler la transaction</p>
                  <p className="text-xs text-slate-300/70">Générez un ID on-chain pour sécuriser la trace de paiement.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sm font-semibold text-sky-200">2</span>
                <div>
                  <p className="font-medium text-white">Créer l’écriture comptable</p>
                  <p className="text-xs text-slate-300/70">Alignez la pièce comptable avec votre plan de comptes.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-200">3</span>
                <div>
                  <p className="font-medium text-white">Réconcilier & ancrer</p>
                  <p className="text-xs text-slate-300/70">Associez les identifiants pour certifier la période et préparer l’audit.</p>
                </div>
              </li>
            </ol>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title={(
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Étape 1</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Simuler une transaction</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">💸</span>
            </div>
          )}
        >
          <form className="space-y-5" onSubmit={submitSimulateTx}>
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Adresse du donateur</span>
                <input className="input" value={fromAddr} onChange={e => setFromAddr(e.target.value)} placeholder="0x…" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Adresse du wallet de l’organisation</span>
                <input className="input" value={toAddr} onChange={e => setToAddr(e.target.value)} placeholder="0x…" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn" type="submit">Lancer la simulation</button>
              <p className="text-xs text-slate-300/70">Un identifiant transaction est généré pour la prochaine réconciliation.</p>
            </div>
          </form>
        </Card>

        <Card
          title={(
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-sky-200/80">Étape 2</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Créer une écriture comptable</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-200">🧾</span>
            </div>
          )}
        >
          <form className="space-y-5" onSubmit={submitCreateEntry}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Journal</span>
                <input className="input" value={journalCode} onChange={e => setJournalCode(e.target.value)} placeholder="BQ" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Date</span>
                <input className="input" type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Référence</span>
              <input className="input" value={ref} onChange={e => setRef(e.target.value)} placeholder="DON-001" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Compte débit</span>
                <input className="input" value={debitAccount} onChange={e => setDebitAccount(e.target.value)} placeholder="5121" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Compte crédit</span>
                <input className="input" value={creditAccount} onChange={e => setCreditAccount(e.target.value)} placeholder="706" />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Devise</span>
              <input className="input" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="EUR" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn" type="submit">Enregistrer l’écriture</button>
              <p className="text-xs text-slate-300/70">Les lignes sont automatiquement équilibrées selon vos montants.</p>
            </div>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card
          title={(
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Étape 3</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Réconcilier transaction & écriture</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">🔗</span>
            </div>
          )}
        >
          <form className="space-y-5" onSubmit={submitReconcile}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Identifiant transaction</span>
                <input className="input" placeholder="tx_id" value={reconcileTxId} onChange={e => setReconcileTxId(e.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Identifiant écriture</span>
                <input className="input" placeholder="entry_id" value={reconcileEntryId} onChange={e => setReconcileEntryId(e.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn" type="submit">Réconcilier</button>
              <p className="text-xs text-slate-300/70">Validez la correspondance pour sécuriser la piste d’audit.</p>
            </div>
          </form>
        </Card>

        <Card
          title={(
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-sky-200/80">Étape finale</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Ancrer une période</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-200">⛓️</span>
            </div>
          )}
        >
          <form className="space-y-5" onSubmit={submitAnchor}>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Période (AAAA-MM)</span>
              <input className="input" type="month" value={period} onChange={e => setPeriod(e.target.value)} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn" type="submit">Déclencher l’ancrage</button>
              <p className="text-xs text-slate-300/70">Un hash inviolable est inscrit sur {networkName || 'le réseau choisi'}.</p>
            </div>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card
          title={(
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Traçabilité</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Transactions récentes</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">🪙</span>
            </div>
          )}
        >
          <ul className="space-y-3">
            {recentTxs.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-300/70">
                Aucune transaction simulée pour le moment. Lancez une simulation pour initialiser la traçabilité.
              </li>
            ) : (
              recentTxs.map(t => (
                <li
                  key={t.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-emerald-200/80">{t.id}</span>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-emerald-200/90">
                      {t.network_name || networkName}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <p className="text-lg font-semibold text-white">{t.amount}</p>
                    <span className="text-sm text-emerald-200/80">{t.token_symbol}</span>
                  </div>
                  <p className="mt-2 truncate text-xs text-slate-300/70">
                    {t.from_addr} → {t.to_addr}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card
          title={(
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-sky-200/80">Journalisation</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Écritures récentes</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-200">📒</span>
            </div>
          )}
        >
          <ul className="space-y-3">
            {recentEntries.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-300/70">
                Aucune écriture encore synchronisée. Créez une pièce pour alimenter le registre.
              </li>
            ) : (
              recentEntries.map(e => (
                <li
                  key={e.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner transition hover:border-sky-400/40 hover:bg-sky-400/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-sky-200/80">{e.id}</span>
                    <span className="rounded-full bg-sky-400/20 px-2 py-1 text-sky-200/90">Journal {e.journal_code}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <p className="text-lg font-semibold text-white">{e.entry_date}</p>
                    <span className="text-sm text-slate-300/75">Ref {e.ref}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </section>
    </div>
  )
}
