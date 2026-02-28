/**
 * FX Service
 * StableFX RFQ integration and currency conversion (read-only)
 */

import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { arcTestnet } from '../config';
import { fxExecutionEngineAbi } from '@/abi/FXExecutionEngine';
import type { 
  FXQuote, 
  FXExposure, 
  RateSnapshot,
  SwapExecution,
  SwapDirection 
} from '@/types/treasury';

const FX_ENGINE_ADDRESS = process.env.NEXT_PUBLIC_FX_ENGINE_ADDRESS as `0x${string}`;

const getClient = () => createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export class FXService {
  private static instance: FXService;
  
  private constructor() {}
  
  static getInstance(): FXService {
    if (!FXService.instance) {
      FXService.instance = new FXService();
    }
    return FXService.instance;
  }

  /**
   * Get current FX rates
   */
  async getCurrentRates(): Promise<RateSnapshot> {
    const client = getClient();
    
    return await client.readContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'getCurrentRates',
    }) as RateSnapshot;
  }

  /**
   * Preview swap output
   */
  async previewSwap(direction: SwapDirection, amount: string): Promise<bigint> {
    const client = getClient();
    const amountWei = parseUnits(amount, 6);
    
    return await client.readContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'previewSwap',
      args: [direction, amountWei],
    }) as bigint;
  }

  /**
   * Get current FX exposure
   */
  async getExposure(): Promise<FXExposure> {
    const client = getClient();
    
    return await client.readContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'getExposure',
    }) as FXExposure;
  }

  /**
   * Get swap count
   */
  async getSwapCount(): Promise<bigint> {
    const client = getClient();
    
    return await client.readContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'getSwapCount',
    }) as bigint;
  }

  // ============ Utility Functions ============

  /**
   * Format rate for display (basis points to percentage)
   */
  formatRate(rate: bigint): string {
    const rateNum = Number(rate) / 10000;
    return rateNum.toFixed(4);
  }

  /**
   * Format spread for display
   */
  formatSpread(spread: bigint): string {
    return `${(Number(spread) / 100).toFixed(2)}%`;
  }

  /**
   * Get direction label
   */
  getDirectionLabel(direction: SwapDirection): string {
    return direction === SwapDirection.USDC_TO_EURC 
      ? 'USDC → EURC' 
      : 'EURC → USDC';
  }

  /**
   * Calculate minimum output with slippage
   */
  calculateMinOutput(expectedOutput: bigint, slippageBps: number = 50): bigint {
    return (expectedOutput * BigInt(10000 - slippageBps)) / 10000n;
  }
}

export const fxService = FXService.getInstance();
