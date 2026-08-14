import { useState } from 'react'
import { TrendingUp, Calculator, Repeat, Percent, Scale, Ruler } from 'lucide-react'
import { currentRates } from '../data/dashboardData'

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatPercent(value, decimals = 1) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(decimals)}%`
}

function CurrentRatesCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Current Rates</h2>
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {currentRates.map((rate) => (
          <li key={rate.id} className="flex items-center justify-between gap-3 py-2.5">
            <p className="text-sm text-slate-600">{rate.label}</p>
            <p className="text-sm font-semibold text-slate-900">{rate.rate}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        Indicative ranges only. Your rate depends on credit, experience, and deal specifics.
      </p>
    </div>
  )
}

function NumberField({ label, prefix, suffix, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1 flex items-center rounded-lg border border-slate-200 px-3 focus-within:border-emerald-400">
        {prefix && <span className="text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full min-w-0 border-none bg-transparent py-2.5 text-sm text-slate-900 focus:outline-none"
        />
        {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
      </div>
    </div>
  )
}

function CalculatorCard({ icon: Icon, title, description, children, results }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
        {results.map((r) => (
          <div key={r.label}>
            <p className="text-xs text-slate-400">{r.label}</p>
            <p className={`mt-0.5 text-base font-bold ${r.className ?? 'text-slate-900'}`}>{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DscrCalculator() {
  const [income, setIncome] = useState(3200)
  const [debtPayment, setDebtPayment] = useState(2500)

  const dscr = debtPayment ? income / debtPayment : NaN
  const qualifies = dscr >= 1.2 ? 'Strong' : dscr >= 1 ? 'Qualifies' : 'Below Threshold'
  const qualifiesClass =
    dscr >= 1.2 ? 'text-emerald-700' : dscr >= 1 ? 'text-amber-700' : 'text-red-700'

  return (
    <CalculatorCard
      icon={Calculator}
      title="DSCR Calculator"
      description="Debt Service Coverage Ratio = Monthly Rent ÷ Monthly Debt Payment."
      results={[
        { label: 'DSCR', value: Number.isFinite(dscr) ? dscr.toFixed(2) : '—' },
        { label: 'Result', value: qualifies, className: qualifiesClass },
      ]}
    >
      <NumberField label="Monthly Rental Income" prefix="$" value={income} onChange={setIncome} />
      <NumberField label="Monthly Debt Payment" prefix="$" value={debtPayment} onChange={setDebtPayment} />
    </CalculatorCard>
  )
}

function BrrrrCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(220000)
  const [rehabCost, setRehabCost] = useState(60000)
  const [arv, setArv] = useState(400000)
  const [refinanceLtv, setRefinanceLtv] = useState(75)

  const totalInvested = purchasePrice + rehabCost
  const refinanceAmount = arv * (refinanceLtv / 100)
  const cashLeftInDeal = totalInvested - refinanceAmount

  return (
    <CalculatorCard
      icon={Repeat}
      title="BRRRR Calculator"
      description="Buy, Rehab, Rent, Refinance, Repeat."
      results={[
        { label: 'Total Cash Invested', value: formatCurrency(totalInvested) },
        { label: 'Refinance Loan Amount', value: formatCurrency(refinanceAmount) },
        {
          label: cashLeftInDeal > 0 ? 'Cash Left in Deal' : 'Cash Out at Refinance',
          value: formatCurrency(Math.abs(cashLeftInDeal)),
          className: cashLeftInDeal > 0 ? 'text-amber-700' : 'text-emerald-700',
        },
      ]}
    >
      <NumberField label="Purchase Price" prefix="$" value={purchasePrice} onChange={setPurchasePrice} />
      <NumberField label="Rehab Cost" prefix="$" value={rehabCost} onChange={setRehabCost} />
      <NumberField label="ARV" prefix="$" value={arv} onChange={setArv} />
      <NumberField label="Refinance LTV" suffix="%" value={refinanceLtv} onChange={setRefinanceLtv} />
    </CalculatorCard>
  )
}

function LoanCalculator() {
  const [amount, setAmount] = useState(450000)
  const [rate, setRate] = useState(6.25)
  const [term, setTerm] = useState(12)

  const monthlyPayment = amount * (rate / 100) / 12
  const totalInterest = monthlyPayment * term

  return (
    <CalculatorCard
      icon={Percent}
      title="Loan Calculator"
      description="Interest-only monthly payment estimate."
      results={[
        { label: 'Monthly Payment', value: formatCurrency(monthlyPayment) },
        { label: `Total Interest (${term || 0} mo)`, value: formatCurrency(totalInterest) },
      ]}
    >
      <NumberField label="Loan Amount" prefix="$" value={amount} onChange={setAmount} />
      <NumberField label="Interest Rate" suffix="%" value={rate} onChange={setRate} />
      <NumberField label="Term" suffix="months" value={term} onChange={setTerm} />
    </CalculatorCard>
  )
}

function LtvCalculator() {
  const [loanAmount, setLoanAmount] = useState(450000)
  const [propertyValue, setPropertyValue] = useState(650000)

  const ltv = propertyValue ? (loanAmount / propertyValue) * 100 : NaN

  return (
    <CalculatorCard
      icon={Scale}
      title="LTV Calculator"
      description="Loan-to-Value = Loan Amount ÷ Property Value."
      results={[{ label: 'LTV', value: formatPercent(ltv) }]}
    >
      <NumberField label="Loan Amount" prefix="$" value={loanAmount} onChange={setLoanAmount} />
      <NumberField label="Property Value" prefix="$" value={propertyValue} onChange={setPropertyValue} />
    </CalculatorCard>
  )
}

function ArvCalculator() {
  const [sqft, setSqft] = useState(1800)
  const [pricePerSqft, setPricePerSqft] = useState(260)

  const arv = sqft * pricePerSqft

  return (
    <CalculatorCard
      icon={Ruler}
      title="ARV Calculator"
      description="After Repair Value = Square Footage × Comparable Price/Sq Ft."
      results={[{ label: 'Estimated ARV', value: formatCurrency(arv) }]}
    >
      <NumberField label="Square Footage" suffix="sq ft" value={sqft} onChange={setSqft} />
      <NumberField label="Comparable Price/Sq Ft" prefix="$" value={pricePerSqft} onChange={setPricePerSqft} />
    </CalculatorCard>
  )
}

export default function MarketToolsSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <CurrentRatesCard />
      <DscrCalculator />
      <BrrrrCalculator />
      <LoanCalculator />
      <LtvCalculator />
      <ArvCalculator />
    </div>
  )
}
