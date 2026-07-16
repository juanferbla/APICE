import React, { useState } from "react";
import { Calculator } from "lucide-react";

export default function CalculatorWidget() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const handlePress = (val: string) => {
    setInput((prev) => prev + val);
  };

  const handleClear = () => {
    setInput("");
    setResult("");
  };

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      // Safe mathematical assessment without eval using Function builder
      // Replace safe math symbols
      const sanitized = input.replace(/x/g, "*").replace(/÷/g, "/");
      if (!sanitized) return;
      const fn = new Function(`return (${sanitized})`);
      const val = fn();
      setResult(String(val));
    } catch (e) {
      setResult("Error");
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-1.5 mb-1.5 flex-shrink-0">
        <Calculator className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display">
          Calculadora
        </span>
      </div>

      {/* Screen displays */}
      <div className="bg-gray-100 p-2.5 rounded-xl border border-slate-200 text-right font-mono flex flex-col justify-end min-h-[50px] mb-2 flex-shrink-0">
        <div className="text-slate-500 text-xs truncate">{input || "0"}</div>
        <div className="text-slate-800 text-lg font-bold truncate">{result || "0"}</div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1 flex-1 text-xs font-bold min-h-0">
        <button
          onClick={handleClear}
          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
        >
          C
        </button>
        <button
          onClick={handleBackspace}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition cursor-pointer"
        >
          ←
        </button>
        <button
          onClick={() => handlePress("%")}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition cursor-pointer"
        >
          %
        </button>
        <button
          onClick={() => handlePress("÷")}
          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer"
        >
          ÷
        </button>

        {["7", "8", "9"].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            className="p-1.5 bg-white border border-[#E1E4E8] hover:bg-gray-50 text-gray-800 rounded-lg transition cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handlePress("x")}
          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer"
        >
          x
        </button>

        {["4", "5", "6"].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            className="p-1.5 bg-white border border-[#E1E4E8] hover:bg-gray-50 text-gray-800 rounded-lg transition cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handlePress("-")}
          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer"
        >
          -
        </button>

        {["1", "2", "3"].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            className="p-1.5 bg-white border border-[#E1E4E8] hover:bg-gray-50 text-gray-800 rounded-lg transition cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handlePress("+")}
          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer"
        >
          +
        </button>

        <button
          onClick={() => handlePress("0")}
          className="col-span-2 p-1.5 bg-white border border-[#E1E4E8] hover:bg-gray-50 text-gray-800 rounded-lg transition cursor-pointer"
        >
          0
        </button>
        <button
          onClick={() => handlePress(".")}
          className="p-1.5 bg-white border border-[#E1E4E8] hover:bg-gray-50 text-gray-800 rounded-lg transition cursor-pointer"
        >
          .
        </button>
        <button
          onClick={handleCalculate}
          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition cursor-pointer"
        >
          =
        </button>
      </div>
    </div>
  );
}
