'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '@/components/Card'

const tabs = [
  { id: 'donation', label: 'Make a donation' },
  { id: 'cashflow', label: 'CashFlow statement' },
  { id: 'transactions', label: 'Transaction book' },
  { id: 'pl', label: 'P&L' },
  { id: 'balance', label: 'BalanceSheet' },
]

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 shadow-inner shadow-black/10 placeholder:text-slate-400/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950'

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-transform duration-200 hover:-translate-y-0.5 hover:from-emerald-300 hover:to-sky-400 focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60'

const tabsContainerClass = 'flex w-full border-b border-white/20 bg-white/5 backdrop-blur-sm'

const tabButtonBaseClass =
  'flex-1 border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950'

const tabPanelClass = 'rounded-b-2xl border border-t-0 border-white/20 bg-slate-950/40 p-6 shadow-inner'

export default function Home() {
  const [orgs, setOrgs] = useState([])
  const [orgsError, setOrgsError] = useState('')
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [activeTab, setActiveTab] = useState('donation')

  const [networkName, setNetworkName] = useState('base')
  const [chainId, setChainId] = useState(8453)
  const [tokenSymbol, setTokenSymbol] = useState('USDC')
  const [decimals, setDecimals] = useState(6)
  const [fromAddr, setFromAddr] = useState('0x donor ...')
  const [toAddr, setToAddr] = useState('0x wallet org ...')
  const [amount, setAmount] = useState('50')
  const [journalCode, setJournalCode] = useState('BQ')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState('DON-001')
  const [debitAccount, setDebitAccount] = useState('5121')
  const [creditAccount, setCreditAccount] = useState('706')
  const [currency, setCurrency] = useState('EUR')
  const [reconcileTxId, setReconcileTxId] = useState('')
  const [reconcileEntryId, setReconcileEntryId] = useState('')
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))

  const [recentTxs, setRecentTxs] = useState([])
  const [recentEntries, setRecentEntries] = useState([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState('')

  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')

  const isOrgSelected = Boolean(orgId)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [currency],
  )

  const formatCurrency = useCallback(
    value => currencyFormatter.format(Number(value || 0)),
    [currencyFormatter],
  )

  useEffect(() => {
    let cancelled = false
    async function loadOrgs() {
      setIsLoadingOrgs(true)
      setOrgsError('')
      try {
        const res = await fetch('/api/orgs')
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.error || 'Impossible de charger les organisations')
        }
        if (!Array.isArray(data)) {
          throw new Error('Réponse inattendue du serveur')
        }
        if (!cancelled) {
          setOrgs(data)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setOrgs([])
          setOrgsError(error.message || 'Impossible de charger les organisations')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrgs(false)
        }
      }
    }
    loadOrgs()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!orgId) {
      setSelectedOrg(null)
      return
    }
    const found = orgs.find(org => org.id === orgId) || null
    setSelectedOrg(found)
  }, [orgId, orgs])

  const refreshLists = useCallback(async targetOrgId => {
    if (!targetOrgId) return
    setRecentLoading(true)
    setRecentError('')
    try {
      const query = `?org_id=${encodeURIComponent(targetOrgId)}`
      const [txRes, enRes] = await Promise.all([
        fetch(`/api/transactions/simulate${query}`),
        fetch(`/api/entries${query}`),
      ])

      const txJson = await txRes.json().catch(() => null)
      if (txRes.ok) {
        setRecentTxs(Array.isArray(txJson) ? txJson : [])
      } else {
        const message = txJson?.error || 'Impossible de récupérer les transactions'
        setRecentTxs([])
        setRecentError(message)
      }

      const enJson = await enRes.json().catch(() => null)
      if (enRes.ok) {
        setRecentEntries(Array.isArray(enJson) ? enJson : [])
      } else {
        const message = enJson?.error || 'Impossible de récupérer les écritures'
        setRecentEntries([])
        setRecentError(prev => prev || message)
      }
    } catch (error) {
      console.error(error)
      setRecentTxs([])
      setRecentEntries([])
      setRecentError(error.message || 'Une erreur est survenue lors du chargement des journaux')
    } finally {
      setRecentLoading(false)
    }
  }, [])

  const refreshInsights = useCallback(async targetOrgId => {
    if (!targetOrgId) return
    setInsightsLoading(true)
    setInsightsError('')
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(targetOrgId)}/insights`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de calculer les états financiers')
      }
      setInsights(data)
    } catch (error) {
      console.error(error)
      setInsights(null)
      setInsightsError(error.message || 'Une erreur est survenue lors du calcul des états financiers')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!orgId) {
      setRecentTxs([])
      setRecentEntries([])
      setRecentError('')
      setInsights(null)
      setInsightsError('')
      return
    }
    setActiveTab('donation')
    setRecentTxs([])
    setRecentEntries([])
    setRecentError('')
    setInsights(null)
    setInsightsError('')
    setReconcileTxId('')
    setReconcileEntryId('')
    refreshLists(orgId)
    refreshInsights(orgId)
  }, [orgId, refreshInsights, refreshLists])

  const renderInsightsContent = useCallback(
    factory => {
      if (insightsLoading) {
        return <p className="text-sm text-slate-300/70">Calcul en cours…</p>
      }
      if (insightsError) {
        return <p className="text-sm text-rose-300">{insightsError}</p>
      }
      if (!insights) {
        return <p className="text-sm text-slate-300/70">Aucune donnée disponible pour cette organisation.</p>
      }
      return factory()
    },
    [insights, insightsError, insightsLoading],
  )

  async function submitSimulateTx(e) {
    e.preventDefault()
    if (!orgId) {
      alert('Sélectionnez une organisation avant de lancer la simulation.')
      return
    }
    try {
      const res = await fetch('/api/transactions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          network_name: networkName,
          chain_id: Number(chainId),
          token_symbol: tokenSymbol,
          decimals: Number(decimals),
          from_addr: fromAddr,
          to_addr: toAddr,
          amount,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        alert('Transaction simulée')
        setReconcileTxId(j?.id || '')
        await refreshLists(orgId)
      } else {
        alert('Erreur: ' + (j?.error || ''))
      }
    } catch (error) {
      alert('Erreur: ' + (error.message || 'inconnue'))
    }
  }

  async function submitCreateEntry(e) {
    e.preventDefault()
    if (!orgId) {
      alert('Sélectionnez une organisation avant d’enregistrer une écriture.')
      return
    }
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          journal_code: journalCode,
          entry_date: entryDate,
          ref,
          lines: [
            {
              account_code: debitAccount,
              debit: amount,
              credit: 0,
              currency,
              description: 'Encaissement don',
            },
            {
              account_code: creditAccount,
              debit: 0,
              credit: amount,
              currency,
              description: 'Produit de don',
            },
          ],
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        alert('Écriture créée')
        setReconcileEntryId(j?.id || '')
        await Promise.all([refreshLists(orgId), refreshInsights(orgId)])
      } else {
        alert('Erreur: ' + (j?.error || ''))
      }
    } catch (error) {
      alert('Erreur: ' + (error.message || 'inconnue'))
    }
  }

  async function submitReconcile(e) {
    e.preventDefault()
    if (!orgId) {
      alert('Sélectionnez une organisation avant de réconcilier.')
      return
    }
    try {
      const res = await fetch('/api/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          tx_id: reconcileTxId,
          entry_id: reconcileEntryId,
          confidence: 95,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        alert('Réconciliation OK')
        await refreshLists(orgId)
      } else {
        alert('Erreur: ' + (j?.error || ''))
      }
    } catch (error) {
      alert('Erreur: ' + (error.message || 'inconnue'))
    }
  }

  async function submitAnchor(e) {
    e.preventDefault()
    if (!orgId) {
      alert('Sélectionnez une organisation avant d’ancrer une période.')
      return
    }
    try {
      const res = await fetch('/api/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, period, network_name: networkName }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        alert('Ancrage enregistré')
      } else {
        alert('Erreur: ' + (j?.error || ''))
      }
    } catch (error) {
      alert('Erreur: ' + (error.message || 'inconnue'))
    }
  }

  const handleOrgChange = event => {
    setOrgId(event.target.value)
  }

  const handleRefreshInsights = () => {
    if (orgId) refreshInsights(orgId)
  }

  const handleRefreshBook = () => {
    if (orgId) refreshLists(orgId)
  }

  const cashflow = insights?.cashflow
  const plData = insights?.pl
  const balanceSheet = insights?.balanceSheet

  return (
    <div className="space-y-12">
      <Card
        title={(
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Onboarding</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Sélectionner une organisation</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300/80">
                Choisissez l’entité à analyser avant d’accéder aux actions opérationnelles et aux rapports consolidés.
              </p>
            </div>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">
              🏢
            </span>
          </div>
        )}
      >
        {isLoadingOrgs ? (
          <p className="text-sm text-slate-300/80">Chargement des organisations…</p>
        ) : orgsError ? (
          <p className="text-sm text-rose-300">{orgsError}</p>
        ) : orgs.length === 0 ? (
          <p className="text-sm text-slate-300/80">
            Aucune organisation n’est disponible pour le moment. Ajoutez une entité dans votre base de données pour commencer.
          </p>
        ) : (
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Organisation</span>
              <select className={inputClass} value={orgId} onChange={handleOrgChange}>
                <option value="">Sélectionnez une organisation…</option>
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedOrg ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300/80">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Organisation active</p>
                <p className="mt-2 text-sm font-semibold text-white">{selectedOrg.label}</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-300/70">{orgId}</p>
                <p className="mt-3 text-xs text-slate-400/70">
                  Les cinq onglets ci-dessous appliqueront automatiquement ce contexte organisationnel.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-300/80">
                Une fois l’organisation sélectionnée, vous accéderez aux onglets « Make a donation », « CashFlow statement »,
                « Transaction book », « P&L » et « BalanceSheet » avec les données correspondantes.
              </p>
            )}
          </div>
        )}
      </Card>

      {isOrgSelected ? (
        <>
          <div className={`${tabsContainerClass} rounded-t-2xl overflow-hidden`}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`${tabButtonBaseClass} ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-400/10 text-white shadow-inner shadow-emerald-300/20'
                      : 'hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className={tabPanelClass}>
            {activeTab === 'donation' && (
              <div className="space-y-12">
              <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                <Card
                  title={(
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Paramétrage initial</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Identité & réseau d’orchestration</h2>
                        <p className="mt-3 max-w-xl text-sm text-slate-300/80">
                          Ces réglages s’appliquent à l’ensemble du workflow (simulation, écriture, réconciliation et ancrage) pour
                          l’organisation sélectionnée.
                        </p>
                      </div>
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">
                        ⚙️
                      </span>
                    </div>
                  )}
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">
                        Organisation sélectionnée
                      </span>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300/80">
                        <p className="font-semibold text-white">{selectedOrg?.label || '—'}</p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-300/70">{orgId}</p>
                      </div>
                    </div>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Réseau</span>
                      <input className={inputClass} value={networkName} onChange={e => setNetworkName(e.target.value)} placeholder="base" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Chain ID</span>
                      <input className={inputClass} type="number" value={chainId} onChange={e => setChainId(e.target.value)} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Token (symbole)</span>
                      <input className={inputClass} value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} placeholder="USDC" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Décimales</span>
                      <input className={inputClass} type="number" value={decimals} onChange={e => setDecimals(e.target.value)} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Montant cible</span>
                      <input className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} />
                    </label>
                  </div>
                </Card>

                <Card
                  title={(
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Vision synthétique</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Aperçu en temps réel</h2>
                      <p className="mt-3 text-sm text-slate-300/80">
                        Suivez les jalons du parcours comptable pour {selectedOrg?.label || 'votre organisation'}.
                      </p>
                    </div>
                  )}
                >
                  <div className="grid gap-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Organisation</p>
                        <p className="mt-3 text-sm font-semibold text-white">{selectedOrg?.label || '—'}</p>
                        <p className="mt-2 break-all font-mono text-xs text-slate-300/70">{orgId}</p>
                      </div>
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
                        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-200">
                          1
                        </span>
                        <div>
                          <p className="font-medium text-white">Simuler la transaction</p>
                          <p className="text-xs text-slate-300/70">Générez un ID on-chain pour sécuriser la trace de paiement.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sm font-semibold text-sky-200">
                          2
                        </span>
                        <div>
                          <p className="font-medium text-white">Créer l’écriture comptable</p>
                          <p className="text-xs text-slate-300/70">Alignez la pièce comptable avec votre plan de comptes.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-200">
                          3
                        </span>
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
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">
                        💸
                      </span>
                    </div>
                  )}
                >
                  <form className="space-y-5" onSubmit={submitSimulateTx}>
                    <div className="space-y-4">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Adresse du donateur</span>
                        <input className={inputClass} value={fromAddr} onChange={e => setFromAddr(e.target.value)} placeholder="0x…" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Adresse du wallet de l’organisation</span>
                        <input className={inputClass} value={toAddr} onChange={e => setToAddr(e.target.value)} placeholder="0x…" />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className={primaryButtonClass} type="submit" disabled={!isOrgSelected}>
                        Lancer la simulation
                      </button>
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
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-200">
                        🧾
                      </span>
                    </div>
                  )}
                >
                  <form className="space-y-5" onSubmit={submitCreateEntry}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Journal</span>
                        <input className={inputClass} value={journalCode} onChange={e => setJournalCode(e.target.value)} placeholder="BQ" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Date</span>
                        <input className={inputClass} type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Référence</span>
                      <input className={inputClass} value={ref} onChange={e => setRef(e.target.value)} placeholder="DON-001" />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Compte débit</span>
                        <input className={inputClass} value={debitAccount} onChange={e => setDebitAccount(e.target.value)} placeholder="5121" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Compte crédit</span>
                        <input className={inputClass} value={creditAccount} onChange={e => setCreditAccount(e.target.value)} placeholder="706" />
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Devise</span>
                      <input className={inputClass} value={currency} onChange={e => setCurrency(e.target.value)} placeholder="EUR" />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className={primaryButtonClass} type="submit" disabled={!isOrgSelected}>
                        Enregistrer l’écriture
                      </button>
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
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">
                        🔗
                      </span>
                    </div>
                  )}
                >
                  <form className="space-y-5" onSubmit={submitReconcile}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Identifiant transaction</span>
                        <input className={inputClass} placeholder="tx_id" value={reconcileTxId} onChange={e => setReconcileTxId(e.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Identifiant écriture</span>
                        <input className={inputClass} placeholder="entry_id" value={reconcileEntryId} onChange={e => setReconcileEntryId(e.target.value)} />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className={primaryButtonClass} type="submit" disabled={!isOrgSelected}>
                        Réconcilier
                      </button>
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
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-200">
                        ⛓️
                      </span>
                    </div>
                  )}
                >
                  <form className="space-y-5" onSubmit={submitAnchor}>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">Période (AAAA-MM)</span>
                      <input className={inputClass} type="month" value={period} onChange={e => setPeriod(e.target.value)} />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className={primaryButtonClass} type="submit" disabled={!isOrgSelected}>
                        Déclencher l’ancrage
                      </button>
                      <p className="text-xs text-slate-300/70">Un hash inviolable est inscrit sur {networkName || 'le réseau choisi'}.</p>
                    </div>
                  </form>
                </Card>
              </section>
            </div>
            )}

            {activeTab === 'cashflow' && (
              <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-2">
                <button className={primaryButtonClass} type="button" onClick={handleRefreshInsights} disabled={insightsLoading}>
                  Recalculer
                </button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <Card
                  title={(
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Analyse trésorerie</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">CashFlow statement</h2>
                      <p className="mt-3 text-sm text-slate-300/80">
                        Variation nette des comptes de trésorerie pour {selectedOrg?.label || 'l’organisation sélectionnée'}.
                      </p>
                    </div>
                  )}
                >
                  {renderInsightsContent(() => {
                    if (!cashflow || (cashflow.accounts?.length ?? 0) === 0) {
                      return <p className="text-sm text-slate-300/80">Pas de mouvement de trésorerie enregistré.</p>
                    }
                    return (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Entrées</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(cashflow.inflows)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Sorties</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(cashflow.outflows)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Variation nette</p>
                            <p
                              className={`mt-3 text-xl font-semibold ${
                                cashflow.netChange >= 0 ? 'text-emerald-200' : 'text-rose-200'
                              }`}
                            >
                              {formatCurrency(cashflow.netChange)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300/70">
                          Calcul basé sur les comptes de classe 5 ({cashflow.accounts.length} compte
                          {cashflow.accounts.length > 1 ? 's' : ''}).
                        </p>
                      </div>
                    )
                  })}
                </Card>

                <Card title="Détail par compte">
                  {renderInsightsContent(() => (
                    <ul className="space-y-3">
                      {cashflow.accounts.map(acc => (
                        <li
                          key={acc.code}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {acc.code}
                                <span className="ml-2 text-xs font-medium text-slate-300/70">{acc.name}</span>
                              </p>
                              <p className="mt-1 text-xs text-slate-300/70">
                                Débits {formatCurrency(acc.debit)} • Crédits {formatCurrency(acc.credit)}
                              </p>
                            </div>
                            <div className="text-right text-sm font-semibold">
                              <p className={acc.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                {formatCurrency(acc.net)}
                              </p>
                              <p className="text-xs text-slate-400/70">
                                {acc.net >= 0 ? 'Entrée nette' : 'Sortie nette'}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ))}
                </Card>
              </div>
            </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-2">
                <button className={primaryButtonClass} type="button" onClick={handleRefreshBook} disabled={recentLoading}>
                  Actualiser
                </button>
              </div>
              {recentError && <p className="text-sm text-rose-300">{recentError}</p>}
              <div className="grid gap-6 xl:grid-cols-2">
                <Card
                  title={(
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Traçabilité</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Transactions on-chain</h2>
                      </div>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-200">
                        🪙
                      </span>
                    </div>
                  )}
                >
                  {recentLoading ? (
                    <p className="text-sm text-slate-300/80">Chargement…</p>
                  ) : recentTxs.length === 0 ? (
                    <p className="text-sm text-slate-300/80">Aucune transaction simulée pour le moment.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentTxs.map(t => (
                        <li
                          key={t.id}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-emerald-200/80">{t.id}</span>
                            <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-emerald-200/90">
                              {t.network_name || networkName || 'réseau inconnu'}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-baseline gap-2">
                            <p className="text-lg font-semibold text-white">{t.amount}</p>
                            <span className="text-sm text-emerald-200/80">{t.token_symbol}</span>
                          </div>
                          <p className="mt-2 truncate text-xs text-slate-300/70">
                            {t.from_addr} → {t.to_addr}
                          </p>
                          {t.block_time && (
                            <p className="mt-1 text-[0.65rem] text-slate-400/70">
                              {new Date(t.block_time).toLocaleString('fr-FR')}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card
                  title={(
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-sky-200/80">Journalisation</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Écritures comptables</h2>
                      </div>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-200">
                        📒
                      </span>
                    </div>
                  )}
                >
                  {recentLoading ? (
                    <p className="text-sm text-slate-300/80">Chargement…</p>
                  ) : recentEntries.length === 0 ? (
                    <p className="text-sm text-slate-300/80">Aucune écriture encore synchronisée.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentEntries.map(e => (
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
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
            )}

            {activeTab === 'pl' && (
              <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-2">
                <button className={primaryButtonClass} type="button" onClick={handleRefreshInsights} disabled={insightsLoading}>
                  Recalculer
                </button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                <Card
                  title={(
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Résultat</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">P&L</h2>
                      <p className="mt-3 text-sm text-slate-300/80">
                        Vision synthétique des produits et charges pour {selectedOrg?.label || 'l’organisation analysée'}.
                      </p>
                    </div>
                  )}
                >
                  {renderInsightsContent(() => {
                    if (!plData) {
                      return <p className="text-sm text-slate-300/80">Aucune donnée de résultat disponible.</p>
                    }
                    return (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Produits</p>
                          <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(plData.revenueTotal)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Charges</p>
                          <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(plData.expenseTotal)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Résultat net</p>
                          <p className={`mt-3 text-xl font-semibold ${plData.net >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                            {formatCurrency(plData.net)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </Card>

                <Card title="Ventilation par classe">
                  {renderInsightsContent(() => (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Revenus (classe 7)</h3>
                        <ul className="mt-3 space-y-3">
                          {plData.revenues.length === 0 ? (
                            <li className="text-sm text-slate-300/80">Aucun produit enregistré.</li>
                          ) : (
                            plData.revenues.map(rev => (
                              <li
                                key={rev.code}
                                className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 shadow-inner"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="font-semibold text-white">{rev.code}</span>
                                  <span className="font-semibold text-emerald-200">{formatCurrency(rev.amount)}</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-300/70">{rev.name}</p>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Charges (classe 6)</h3>
                        <ul className="mt-3 space-y-3">
                          {plData.expenses.length === 0 ? (
                            <li className="text-sm text-slate-300/80">Aucune charge saisie.</li>
                          ) : (
                            plData.expenses.map(exp => (
                              <li
                                key={exp.code}
                                className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 shadow-inner"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="font-semibold text-white">{exp.code}</span>
                                  <span className="font-semibold text-rose-200">{formatCurrency(exp.amount)}</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-300/70">{exp.name}</p>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
            )}

            {activeTab === 'balance' && (
              <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-2">
                <button className={primaryButtonClass} type="button" onClick={handleRefreshInsights} disabled={insightsLoading}>
                  Recalculer
                </button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                <Card
                  title={(
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-300/70">Structure financière</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">BalanceSheet</h2>
                      <p className="mt-3 text-sm text-slate-300/80">
                        Répartition des actifs et passifs pour {selectedOrg?.label || 'l’organisation suivie'}.
                      </p>
                    </div>
                  )}
                >
                  {renderInsightsContent(() => {
                    if (!balanceSheet) {
                      return <p className="text-sm text-slate-300/80">Aucune donnée de bilan disponible.</p>
                    }
                    return (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Actif total</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(balanceSheet.totalAssets)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Passif total</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(balanceSheet.totalLiabilities)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Écart</p>
                            <p
                              className={`mt-3 text-xl font-semibold ${
                                Math.abs(balanceSheet.balance) < 1e-2 ? 'text-emerald-200' : 'text-amber-200'
                              }`}
                            >
                              {formatCurrency(balanceSheet.balance)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300/70">
                          Le résultat net (P&L) est intégré côté passif afin d’aligner le bilan.
                        </p>
                      </div>
                    )
                  })}
                </Card>

                <Card title="Détail actif / passif">
                  {renderInsightsContent(() => (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Actif</h3>
                        <ul className="mt-3 space-y-3">
                          {balanceSheet.assets.length === 0 ? (
                            <li className="text-sm text-slate-300/80">Aucun poste d’actif identifié.</li>
                          ) : (
                            balanceSheet.assets.map(item => (
                              <li
                                key={item.label}
                                className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 shadow-inner"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="font-semibold text-white">{item.label}</span>
                                  <span className="font-semibold text-emerald-200">{formatCurrency(item.amount)}</span>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Passif</h3>
                        <ul className="mt-3 space-y-3">
                          {balanceSheet.liabilities.length === 0 ? (
                            <li className="text-sm text-slate-300/80">Aucun poste de passif identifié.</li>
                          ) : (
                            balanceSheet.liabilities.map(item => (
                              <li
                                key={item.label}
                                className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 shadow-inner"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="font-semibold text-white">{item.label}</span>
                                  <span className="font-semibold text-sky-200">{formatCurrency(item.amount)}</span>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}
          </div>
        </>
      ) : (
        <Card title="Configuration requise">
          <p className="text-sm text-slate-300/80">
            Sélectionnez une organisation pour accéder aux simulations, au livre de transactions et aux états financiers.
          </p>
        </Card>
      )}
    </div>
  )
}

