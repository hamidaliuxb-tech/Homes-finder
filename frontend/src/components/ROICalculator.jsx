import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ROICalculator() {
  const [price, setPrice] = useState("2850000");
  const [rent, setRent] = useState("180000");

  const p = Number(price) || 0;
  const r = Number(rent) || 0;
  const grossYield = p > 0 ? ((r / p) * 100).toFixed(2) : "0.00";
  const monthly = r > 0 ? Math.round(r / 12).toLocaleString() : "0";

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-stretch" data-testid="roi-calculator">
      <div className="bg-[#FAFAFA] border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <Label className="text-slate-700">Property Purchase Price (AED)</Label>
          <Input data-testid="roi-price" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} className="mt-1.5 h-12 text-lg" />
        </div>
        <div>
          <Label className="text-slate-700">Expected Annual Rent (AED)</Label>
          <Input data-testid="roi-rent" value={rent} onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ""))} className="mt-1.5 h-12 text-lg" />
        </div>
      </div>
      <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400">Estimated Gross Rental Yield</p>
          <div className="font-serif text-6xl font-bold text-amber-400 mt-3" data-testid="roi-yield">{grossYield}%</div>
          <p className="mt-4 text-slate-300 text-sm">Approx. <span className="font-semibold text-white">AED {monthly}</span> monthly rental income</p>
        </div>
        <p className="mt-8 text-xs text-slate-400 text-center border-t border-slate-700 pt-4">
          Indicative gross yield before service charges, fees and vacancy. Returns are not guaranteed and depend on market conditions.
        </p>
      </div>
    </div>
  );
}
