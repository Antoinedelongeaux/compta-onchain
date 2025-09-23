import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_LINES = 5000

function toNumber(value) {
  if (typeof value === 'number') return value
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function computeCashflow(lines) {
  const map = new Map()
  for (const line of lines) {
    const code = line.account?.code
    if (!code || !code.startsWith('5')) continue
    const name = line.account?.name || `Compte ${code}`
    const debit = toNumber(line.debit)
    const credit = toNumber(line.credit)
    if (!map.has(code)) {
      map.set(code, { code, name, debit: 0, credit: 0, net: 0 })
    }
    const entry = map.get(code)
    entry.debit += debit
    entry.credit += credit
    entry.net += debit - credit
  }
  const accounts = Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
  const inflows = accounts.filter(acc => acc.net > 0).reduce((sum, acc) => sum + acc.net, 0)
  const outflows = accounts.filter(acc => acc.net < 0).reduce((sum, acc) => sum + Math.abs(acc.net), 0)
  return {
    inflows: round(inflows),
    outflows: round(outflows),
    netChange: round(inflows - outflows),
    accounts: accounts.map(acc => ({
      ...acc,
      debit: round(acc.debit),
      credit: round(acc.credit),
      net: round(acc.net),
    })),
  }
}

function computeProfitAndLoss(lines) {
  const revenues = new Map()
  const expenses = new Map()
  for (const line of lines) {
    const code = line.account?.code
    if (!code) continue
    const name = line.account?.name || `Compte ${code}`
    const debit = toNumber(line.debit)
    const credit = toNumber(line.credit)
    if (code.startsWith('7')) {
      const amount = credit - debit
      if (Math.abs(amount) < 1e-9) continue
      if (!revenues.has(code)) revenues.set(code, { code, name, amount: 0 })
      revenues.get(code).amount += amount
    } else if (code.startsWith('6')) {
      const amount = debit - credit
      if (Math.abs(amount) < 1e-9) continue
      if (!expenses.has(code)) expenses.set(code, { code, name, amount: 0 })
      expenses.get(code).amount += amount
    }
  }
  const revenueList = Array.from(revenues.values()).sort((a, b) => a.code.localeCompare(b.code)).map(item => ({
    ...item,
    amount: round(item.amount),
  }))
  const expenseList = Array.from(expenses.values()).sort((a, b) => a.code.localeCompare(b.code)).map(item => ({
    ...item,
    amount: round(item.amount),
  }))
  const revenueTotal = round(revenueList.reduce((sum, item) => sum + item.amount, 0))
  const expenseTotal = round(expenseList.reduce((sum, item) => sum + item.amount, 0))
  return {
    revenueTotal,
    expenseTotal,
    net: round(revenueTotal - expenseTotal),
    revenues: revenueList,
    expenses: expenseList,
  }
}

function computeBalanceSheet(lines, netResult = 0) {
  let fixedAssets = 0
  let inventory = 0
  let receivables = 0
  let cash = 0
  let equity = 0
  let payables = 0

  for (const line of lines) {
    const code = line.account?.code
    if (!code) continue
    const debit = toNumber(line.debit)
    const credit = toNumber(line.credit)
    const head = code[0]

    if (head === '1') {
      equity += credit - debit
    } else if (head === '2') {
      fixedAssets += debit - credit
    } else if (head === '3') {
      inventory += debit - credit
    } else if (head === '4') {
      const net = debit - credit
      if (net >= 0) receivables += net
      else payables += Math.abs(net)
    } else if (head === '5') {
      cash += debit - credit
    }
  }

  const assets = [
    { label: 'Immobilisations (2*)', amount: round(fixedAssets) },
    { label: 'Stocks (3*)', amount: round(inventory) },
    { label: 'Créances & avances (4*)', amount: round(receivables) },
    { label: 'Trésorerie (5*)', amount: round(cash) },
  ].filter(item => Math.abs(item.amount) > 1e-2)

  const liabilities = [
    { label: 'Capitaux propres & dettes (1*)', amount: round(equity) },
    { label: 'Résultat de la période', amount: round(netResult) },
    { label: 'Dettes fournisseurs & autres (4*)', amount: round(payables) },
  ].filter(item => Math.abs(item.amount) > 1e-2)

  const totalAssets = round(assets.reduce((sum, item) => sum + item.amount, 0))
  const totalLiabilities = round(liabilities.reduce((sum, item) => sum + item.amount, 0))

  return {
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
    balance: round(totalAssets - totalLiabilities),
  }
}

// ✅ Correction : params doit être awaited
export async function GET(request, context) {
  const { orgId } = await context.params

  if (!orgId) {
    return NextResponse.json({ error: 'Identifiant organisation requis' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('accounting_entry_lines')
      .select('debit, credit, account:accounting_accounts(code, name)')
      .eq('org_id', orgId)
      .limit(MAX_LINES)
    if (error) throw error

    const lines = (data || []).filter(line => line.account?.code)
    const cashflow = computeCashflow(lines)
    const pl = computeProfitAndLoss(lines)
    const balanceSheet = computeBalanceSheet(lines, pl.net)

    return NextResponse.json({ cashflow, pl, balanceSheet })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erreur inconnue' }, { status: 500 })
  }
}
