'use client';

/**
 * FX Widget Component
 * Quick FX rates display and swap interface
 */

import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { useCurrentRates, usePreviewSwap, useDirectSwap } from '@/hooks/useFX';
import { SwapDirection } from '@/types/treasury';

export function FXWidget() {
  const [direction, setDirection] = useState<SwapDirection>(SwapDirection.USDC_TO_EURC);
  const [amount, setAmount] = useState('');
  
  const { data: rates, isLoading: ratesLoading } = useCurrentRates();
  const { data: preview, isLoading: previewLoading } = usePreviewSwap(direction, amount);
  const { swap, isPending, isConfirming, isSuccess } = useDirectSwap();

  const formatRate = (rate: bigint | undefined) => {
    if (!rate) return '0.0000';
    return (Number(rate) / 10000).toFixed(4);
  };

  const handleSwap = async () => {
    if (!amount || !preview) return;
    
    // Calculate min output with 0.5% slippage
    const minOutput = ((preview as bigint) * 9950n / 10000n).toString();
    await swap(direction, amount, formatUnits(BigInt(minOutput), 6));
  };

  const handleDirectionToggle = () => {
    setDirection(d => 
      d === SwapDirection.USDC_TO_EURC 
        ? SwapDirection.EURC_TO_USDC 
        : SwapDirection.USDC_TO_EURC
    );
    setAmount('');
  };

  const inputToken = direction === SwapDirection.USDC_TO_EURC ? 'USDC' : 'EURC';
  const outputToken = direction === SwapDirection.USDC_TO_EURC ? 'EURC' : 'USDC';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">FX Exchange</h3>
        <div className="text-sm text-gray-400">
          Powered by StableFX
        </div>
      </div>

      {/* Rates Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">USDC/EURC</p>
          <p className="text-lg font-mono text-white">
            {ratesLoading ? '...' : formatRate((rates as any)?.usdcToEurcRate)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">EURC/USDC</p>
          <p className="text-lg font-mono text-white">
            {ratesLoading ? '...' : formatRate((rates as any)?.eurcToUsdcRate)}
          </p>
        </div>
      </div>

      {/* Swap Interface */}
      <div className="space-y-3">
        {/* Input */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">From</span>
            <span className="text-gray-500">{inputToken}</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl text-white placeholder-gray-600 outline-none"
          />
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDirectionToggle}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Output */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">To</span>
            <span className="text-gray-500">{outputToken}</span>
          </div>
          <div className="text-2xl text-white">
            {previewLoading ? (
              <span className="text-gray-600">Calculating...</span>
            ) : preview ? (
              formatUnits(preview as bigint, 6)
            ) : (
              <span className="text-gray-600">0.00</span>
            )}
          </div>
        </div>

        {/* Swap Details */}
        {amount && preview && (
          <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Rate</span>
              <span className="text-white">
                1 {inputToken} = {(Number(preview) / Number(amount) / 1000000).toFixed(4)} {outputToken}
              </span>
            </div>
            <div className="flex justify-between text-gray-400 mt-1">
              <span>Max Slippage</span>
              <span className="text-white">0.5%</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!amount || !preview || isPending || isConfirming}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isPending ? 'Confirm in wallet...' : 'Processing...'}
            </span>
          ) : isSuccess ? (
            'Swap Complete!'
          ) : (
            `Swap ${inputToken} for ${outputToken}`
          )}
        </button>
      </div>
    </div>
  );
}
