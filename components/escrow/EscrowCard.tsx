"use client";

import { formatUSDC } from "@/lib/config";

interface Props {
  escrowId: bigint;
  role: "shipper" | "carrier";
}

/**
 * Escrow Card — displays escrow details via SettlementRouter.
 * Simplified after migration from legacy FreightEscrow to Treasury Suite.
 */
export function EscrowCard({ escrowId, role }: Props) {
  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400">
            #{escrowId.toString()}
          </span>
          <span className="text-xs font-medium text-blue-400">ACTIVE</span>
        </div>
        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase">
          {role}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <p className="text-neutral-500 text-xs mb-0.5">Settlement ID</p>
          <p className="text-neutral-300 font-mono text-xs">
            #{escrowId.toString()}
          </p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs mb-0.5">Status</p>
          <p className="text-emerald-400 text-xs">Pending Settlement</p>
        </div>
      </div>

      {/* Delivery Verification Panel */}
      <div className="border border-neutral-800 rounded-lg p-3 mb-4 bg-neutral-900/50">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
          Delivery Verification
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>📍</span>
            <span>GPS Geofence — Awaiting truck arrival</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>✍️</span>
            <span>Recipient Signature — Awaiting confirmation</span>
          </div>
        </div>
      </div>

      {/* View Button */}
      <a
        href={`https://testnet.arcscan.app`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        View on Arc Explorer →
      </a>
    </div>
  );
}
