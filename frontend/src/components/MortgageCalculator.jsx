import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MortgageCalculator({ price = 0 }) {
  const [amount, setAmount] = useState(String(price ? Math.round(price) : 2850000));
  const [downPct, setDownPct] = useState("20");
  const [term, setTerm] = useState("25");
  const [rate, setRate] = useState("4.5");

  const result = useMemo(() => {
    const p = Number(amount) || 0;
    const dp = Math.min(Math.max(Number(downPct) || 0, 0), 100);
    const years = Number(term) || 0;
    const annualRate = Number(rate) || 0;

    const downPayment = (p * dp) / 100;
    const principal = p - downPayment;
    const n = years * 12;
    const r = annualRate / 100 / 12;

    let monthly = 0;
    if (principal > 0 && n > 0) {
      monthly = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    const totalPaid = monthly * n + downPayment;
    const totalInterest = monthly * n - principal;
    return { downPayment, principal, monthly, totalPaid, totalInterest };
  }, [amount, downPct, term, rate]);

  const fmt = (v) => `AED ${Math.round(v || 0).toLocaleString("en-US")}`;

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-stretch" data-testid="mortgage-calculator">
      <div className="bg-[#FAFAFA] border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <Label className="text-slate-700">Property Price (AED)</Label>
          <Input data-testid="mortgage-price" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} className="mt-1.5 h-12 text-lg" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-700">Down Payment (%)</Label>
            <Input data-testid="mortgage-down" value={downPct} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); setDownPct(v === "" ? "" : String(Math.min(Number(v), 100))); }} className="mt-1.5 h-12 text-lg" />
          </div>
          <div>
            <Label className="text-slate-700">Loan Term (years)</Label>
            <Input data-testid="mortgage-term" value={term} onChange={(e) => setTerm(e.target.value.replace(/[^0-9]/g, ""))} className="mt-1.5 h-12 text-lg" />
          </div>
        </div>
        <div>
          <Label className="text-slate-700">Interest Rate (% per year)</Label>
          <Input data-testid="mortgage-rate" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))} className="mt-1.5 h-12 text-lg" />
        </div>
        <div className="text-sm text-slate-500 border-t border-slate-200 pt-3">
          Down payment: <span className="font-semibold text-slate-800">{fmt(result.downPayment)}</span> · Loan amount: <span className="font-semibold text-slate-800">{fmt(result.principal)}</span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400">Estimated Monthly Payment</p>
          <div className="font-serif text-5xl font-bold text-amber-400 mt-3" data-testid="mortgage-monthly">{fmt(result.monthly)}</div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-slate-800/60 p-4">
            <div className="text-xs text-slate-400">Total Amount Paid</div>
            <div className="font-semibold text-lg mt-1" data-testid="mortgage-total">{fmt(result.totalPaid)}</div>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-4">
            <div className="text-xs text-slate-400">Total Interest</div>
            <div className="font-semibold text-lg mt-1" data-testid="mortgage-interest">{fmt(result.totalInterest)}</div>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400 text-center border-t border-slate-700 pt-4">
          Indicative estimate only. Actual rates, fees and eligibility vary by lender and are not guaranteed.
        </p>
      </div>
    </div>
  );
}
