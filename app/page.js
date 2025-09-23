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
  'w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400/75 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200/70 focus:ring-offset-2 focus:ring-offset-slate-950'

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-300 focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60'

const tabsContainerClass =
  'flex w-full flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.05] p-1 backdrop-blur-sm'

const tabButtonBaseClass =
  'flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

const tabPanelClass = 'rounded-3xl border border-white/12 bg-white/[0.03] p-6 backdrop-blur-sm'

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
        
      >
        {isLoadingOrgs ? (
          <p className="text-sm text-slate-300/80">Chargement des organisations…</p>
        ) : orgsError ? (
          <p className="text-sm text-rose-300">{orgsError}</p>
        ) : orgs.length === 0 ? (
          <p className="text-sm text-slate-200/80">Aucune organisation trouvée. Ajoutez-en une pour commencer.</p>
        ) : (
          <div className="space-y-4">
            <label className="space-y-2">
          
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
              <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 text-sm text-slate-200/85">
             
                <p className="mt-2 text-sm font-semibold text-white">{selectedOrg.label}</p>
       

              </div>
            ) : (
              <p className="text-sm text-slate-200/80">Sélectionnez une organisation pour déverrouiller les onglets.</p>
            )}
          </div>
        )}
      </Card>

      {isOrgSelected ? (
        <>
          <div className={tabsContainerClass}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`${tabButtonBaseClass} ${
                    isActive
                      ? 'bg-slate-950/60 text-white shadow-sm'
                      : 'hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className={`${tabPanelClass} mt-4`}>
            {activeTab === 'donation' && (
              <div className="space-y-12">
              <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card
  title={(
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
          Make a donation
        </p>
      </div>
    </div>
  )}
  theme="light"
>
                  <div className="grid gap-5 md:grid-cols-2">
             
                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300/80">Réseau</span>
                      <input className={inputClass} value={networkName} onChange={e => setNetworkName(e.target.value)} placeholder="base" />
                    </label>
                   
                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300/80">Token</span>
                      <input className={inputClass} value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} placeholder="USDC" />
                    </label>
                  
                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300/80">Montant </span>
                      <input className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} />
                    </label>
                  </div>
                  <form className="space-y-5" onSubmit={submitSimulateTx}>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button className={primaryButtonClass} type="submit" disabled={!isOrgSelected}>
                        Donner
                      </button>
                  
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
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Trésorerie</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Flux de trésorerie</h2>
                      <p className="mt-2 text-sm text-slate-200/80">
                        Synthèse des entrées et sorties pour {selectedOrg?.label || 'l’organisation sélectionnée'}.
                      </p>
                    </div>
                  )}
                >
                  {renderInsightsContent(() => {
                    if (!cashflow || (cashflow.accounts?.length ?? 0) === 0) {
                      return <p className="text-sm text-slate-200/80">Aucun mouvement enregistré.</p>
                    }
                    return (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Entrées</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(cashflow.inflows)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Sorties</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(cashflow.outflows)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
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
                          Basé sur {cashflow.accounts.length} compte
                          {cashflow.accounts.length > 1 ? 's' : ''} de classe 5.
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
                          className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 transition hover:border-emerald-300/40 hover:bg-emerald-400/10"
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
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Traçabilité</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Transactions on-chain</h2>
                      </div>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-xl text-emerald-200">
                        🪙
                      </span>
                    </div>
                  )}
                >
                  {recentLoading ? (
                    <p className="text-sm text-slate-200/80">Chargement…</p>
                  ) : recentTxs.length === 0 ? (
                    <p className="text-sm text-slate-200/80">Aucune transaction simulée.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentTxs.map(t => (
                        <li
                          key={t.id}
                          className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 transition hover:border-emerald-300/40 hover:bg-emerald-400/10"
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
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Journalisation</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Écritures comptables</h2>
                      </div>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-xl text-sky-200">
                        📒
                      </span>
                    </div>
                  )}
                >
                  {recentLoading ? (
                    <p className="text-sm text-slate-200/80">Chargement…</p>
                  ) : recentEntries.length === 0 ? (
                    <p className="text-sm text-slate-200/80">Aucune écriture synchronisée.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentEntries.map(e => (
                        <li
                          key={e.id}
                          className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 transition hover:border-sky-300/40 hover:bg-sky-400/10"
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
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Résultat</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">P&L</h2>
                      <p className="mt-2 text-sm text-slate-200/80">
                        Aperçu des produits et charges pour {selectedOrg?.label || 'l’organisation analysée'}.
                      </p>
                    </div>
                  )}
                >
                  {renderInsightsContent(() => {
                    if (!plData) {
                      return <p className="text-sm text-slate-200/80">Aucune donnée de résultat.</p>
                    }
                    return (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Produits</p>
                          <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(plData.revenueTotal)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Charges</p>
                          <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(plData.expenseTotal)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
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
                                className="rounded-2xl border border-white/12 bg-white/[0.05] p-3"
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
                                className="rounded-2xl border border-white/12 bg-white/[0.05] p-3"
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
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Structure financière</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Bilan</h2>
                      <p className="mt-2 text-sm text-slate-200/80">
                        Répartition des actifs et passifs pour {selectedOrg?.label || 'l’organisation suivie'}.
                      </p>
                    </div>
                  )}
                >
                  {renderInsightsContent(() => {
                    if (!balanceSheet) {
                      return <p className="text-sm text-slate-200/80">Aucune donnée de bilan.</p>
                    }
                    return (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Actif total</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(balanceSheet.totalAssets)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200/80">Passif total</p>
                            <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(balanceSheet.totalLiabilities)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
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
                                className="rounded-2xl border border-white/12 bg-white/[0.05] p-3"
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
                                className="rounded-2xl border border-white/12 bg-white/[0.05] p-3"
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
          <p className="text-sm text-slate-200/80">
            Choisissez une organisation pour afficher les simulations et les rapports.
          </p>
        </Card>
      )}
    </div>
  )
}

