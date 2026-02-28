"use client";

import { useState } from "react";
import { formatUSDC, shortenAddress } from "@/lib/config";
import { useShipment, useEscrowYield, useFundEscrow, useConfirmDelivery, useReleaseFunds } from "@/hooks/useContracts";
import { EscrowStatus, EscrowStatusLabel } from "@/types";

interface Props {
  escrowId: bigint;
  role: "shipper" | "carrier";
}

interface DeliveryVerification {
  gpsArrived: boolean;
  signatureVerified: boolean;
}

const statusStyles: Record<EscrowStatus, string> = {
  [EscrowStatus.CREATED]: "text-neutral-400",
  [EscrowStatus.FUNDED]: "text-blue-400",
  [EscrowStatus.IN_TRANSIT]: "text-amber-400",
  [EscrowStatus.DELIVERED]: "text-emerald-400",
  [EscrowStatus.RELEASED]: "text-neutral-500",
  [EscrowStatus.DISPUTED]: "text-red-400",
  [EscrowStatus.REFUNDED]: "text-neutral-500",
};

export function EscrowCard({ escrowId, role }: Props) {
  const { data: shipment, isLoading } = useShipment(escrowId);
  const { data: currentYield } = useEscrowYield(escrowId);

  const { fund, isPending: isFunding } = useFundEscrow();
  const { confirm, isPending: isConfirming } = useConfirmDelivery();
  const { release, isPending: isReleasing } = useReleaseFunds();

  // Delivery verification state (simulated IoT/GPS data)
  const [verification, setVerification] = useState<DeliveryVerification>({
    gpsArrived: false,
    signatureVerified: false,
  });

  if (isLoading || !shipment) {
    return (
      <div className="card">
        <div className="h-4 skeleton w-24 mb-2" />
        <div className="h-4 skeleton w-32" />
      </div>
    );
  }

  const status = shipment.status as EscrowStatus;
  const canFund = role === "shipper" && status === EscrowStatus.CREATED;
  const canConfirmDelivery = role === "carrier" && (status === EscrowStatus.FUNDED || status === EscrowStatus.IN_TRANSIT);
  const canRelease = status === EscrowStatus.DELIVERED;
  
  // Both conditions must be verified before release is allowed
  const deliveryFullyVerified = verification.gpsArrived && verification.signatureVerified;
  const showVerificationPanel = canRelease || (status === EscrowStatus.FUNDED || status === EscrowStatus.IN_TRANSIT);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400">#{escrowId.toString()}</span>
          <span className={`text-xs font-medium ${statusStyles[status]}`}>
            {EscrowStatusLabel[status]}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium tabular-nums">
            {formatUSDC(shipment.amount)}
          </span>
          <span className="text-neutral-500 text-sm ml-1">USDC</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <p className="text-neutral-500 text-xs mb-0.5">Route</p>
          <p className="text-neutral-300">{shipment.origin} → {shipment.destination}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs mb-0.5">Shipment ID</p>
          <p className="text-neutral-300 font-mono text-xs">{shipment.shipmentId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-neutral-500 text-xs mb-0.5">
            {role === "shipper" ? "Carrier" : "Shipper"}
          </p>
          <p className="text-neutral-300 font-mono text-xs">
            {shortenAddress(role === "shipper" ? shipment.carrier : shipment.shipper)}
          </p>
        </div>
        {currentYield && currentYield > 0n && (
          <div>
            <p className="text-neutral-500 text-xs mb-0.5">Yield Accrued</p>
            <p className="text-emerald-400 tabular-nums">+{formatUSDC(currentYield)}</p>
          </div>
        )}
      </div>

      {/* Delivery Verification Panel */}
      {showVerificationPanel && (
        <div className="border border-neutral-800 rounded-lg p-3 mb-4 bg-neutral-900/50">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">
            Delivery Verification
          </p>
          <div className="space-y-2">
            {/* GPS Geofence Check */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={verification.gpsArrived}
                onChange={(e) => setVerification(prev => ({ ...prev, gpsArrived: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-emerald-500 
                           focus:ring-emerald-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
              />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">📍</span>
                <div>
                  <p className={`text-sm ${verification.gpsArrived ? 'text-emerald-400' : 'text-neutral-300'}`}>
                    GPS Geofence Verified
                  </p>
                  <p className="text-xs text-neutral-500">
                    {verification.gpsArrived 
                      ? `Truck arrived at ${shipment.destination}` 
                      : 'Waiting for truck to enter delivery zone'}
                  </p>
                </div>
              </div>
              {verification.gpsArrived && (
                <span className="text-emerald-400 text-xs font-medium">VERIFIED</span>
              )}
            </label>

            {/* Driver Signature */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={verification.signatureVerified}
                onChange={(e) => setVerification(prev => ({ ...prev, signatureVerified: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-emerald-500 
                           focus:ring-emerald-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
              />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">✍️</span>
                <div>
                  <p className={`text-sm ${verification.signatureVerified ? 'text-emerald-400' : 'text-neutral-300'}`}>
                    Recipient Signature
                  </p>
                  <p className="text-xs text-neutral-500">
                    {verification.signatureVerified 
                      ? 'Digital signature captured' 
                      : 'Awaiting recipient confirmation'}
                  </p>
                </div>
              </div>
              {verification.signatureVerified && (
                <span className="text-emerald-400 text-xs font-medium">SIGNED</span>
              )}
            </label>
          </div>

          {/* Verification Status */}
          {deliveryFullyVerified && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>✓</span>
                <p className="text-sm font-medium">All delivery conditions verified - funds can be released</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canFund && (
          <button
            onClick={() => fund(escrowId)}
            disabled={isFunding}
            className="btn-primary"
          >
            {isFunding ? "Funding..." : "Fund Escrow"}
          </button>
        )}
        {canConfirmDelivery && (
          <button
            onClick={() => confirm(escrowId)}
            disabled={isConfirming}
            className="btn-primary"
          >
            {isConfirming ? "Confirming..." : "Confirm Delivery"}
          </button>
        )}
        {canRelease && (
          <button
            onClick={() => release(escrowId)}
            disabled={isReleasing || !deliveryFullyVerified}
            className={`btn-secondary ${!deliveryFullyVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!deliveryFullyVerified ? 'Complete all verification steps first' : ''}
          >
            {isReleasing ? "Releasing..." : deliveryFullyVerified ? "Release Funds" : "Verify Delivery First"}
          </button>
        )}
      </div>
    </div>
  );
}
