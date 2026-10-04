import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Calculator, DollarSign, PieChart } from "lucide-react";

export default function ROICalculator({
  initialPrice = "2500000",
  initialRent = "175000",
  title = "Rental Yield & ROI Calculator",
  subtitle = "Calculate your estimated gross and net rental returns in the UAE property market.",
}) {
  const [price, setPrice] = useState(String(initialPrice));
  const [rent, setRent] = useState(String(initialRent));
  const [serviceCharges, setServiceCharges] = useState("15000");

  const p = Number(price) || 0;
  const r = Number(rent) || 0;
  const sc = Number(serviceCharges) || 0;

  const grossYield = p > 0 ? ((r / p) * 100).toFixed(2) : "0.00";
  const netIncome = Math.max(0, r - sc);
  const netYield = p > 0 ? ((netIncome / p) * 100).toFixed(2) : "0.00";
  const monthlyGross = r > 0 ? Math.round(r / 12).toLocaleString() : "0";
  const monthlyNet = netIncome > 0 ? Math.round(netIncome / 12).toLocaleString() : "0";
  const fiveYearReturn = Math.round(netIncome * 5).toLocaleString();

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm" data-testid="roi-calculator">
      {(title || subtitle) && (
        <div className="bg-slate-900 text-white p-6 sm:p-7 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="h-4 w-4" /> Investment Returns Analysis
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">{title}</h3>
          {subtitle && <p className="text-slate-300 text-sm mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-0">
        {/* Form Inputs */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-5 bg-[#FAFAFA] border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            <Label className="text-slate-800 font-medium text-sm flex items-center justify-between">
              <span>Property Purchase Price (AED)</span>
              <span className="text-xs text-amber-600 font-normal">e.g. 2.5M AED</span>
            </Label>
            <Input
              data-testid="roi-price"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="2,500,000"
              className="mt-1.5 h-12 text-base font-semibold bg-white border-slate-300"
            />
          </div>

          <div>
            <Label className="text-slate-800 font-medium text-sm flex items-center justify-between">
              <span>Expected Annual Rent (AED)</span>
              <span className="text-xs text-emerald-600 font-normal">Gross Lease</span>
            </Label>
            <Input
              data-testid="roi-rent"
              value={rent}
              onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="175,000"
              className="mt-1.5 h-12 text-base font-semibold bg-white border-slate-300"
            />
          </div>

          <div>
            <Label className="text-slate-800 font-medium text-sm flex items-center justify-between">
              <span>Annual Service Charges / Maintenance (AED)</span>
              <span className="text-xs text-slate-500 font-normal">Optional</span>
            </Label>
            <Input
              data-testid="roi-charges"
              value={serviceCharges}
              onChange={(e) => setServiceCharges(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="15,000"
              className="mt-1.5 h-12 text-base bg-white border-slate-300"
            />
          </div>

          <div className="pt-2 text-xs text-slate-500 leading-relaxed">
            💡 <strong>Market Note:</strong> Dubai average residential gross rental yields range between <strong>6% - 9%</strong>, among the highest globally compared to London (3-4%) and New York (4%).
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-900 text-white flex flex-col justify-between">
          <div>
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-800">
              <div className="text-center p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">Gross Yield</span>
                <span className="font-serif text-3xl sm:text-4xl font-bold text-amber-400 block mt-1" data-testid="roi-yield">
                  {grossYield}%
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">AED {monthlyGross}/mo</span>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">Net Yield</span>
                <span className="font-serif text-3xl sm:text-4xl font-bold text-emerald-400 block mt-1" data-testid="roi-net-yield">
                  {netYield}%
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">AED {monthlyNet}/mo</span>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Net Annual Cashflow:</span>
                <span className="font-semibold text-white">AED {netIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">5-Year Projected Rental Return:</span>
                <span className="font-bold text-amber-300">AED {fiveYearReturn}</span>
              </div>
            </div>
          </div>

          <p className="mt-8 text-[11px] text-slate-500 text-center border-t border-slate-800/80 pt-3">
            Projections are indicative for planning purposes. Market conditions and vacancy rates may vary.
          </p>
        </div>
      </div>
    </div>
  );
}
