"use client";

import { formatUSDC, shortenAddress } from "@/lib/config";
import { useShipment, useEscrowYield, useFundEscrow, useConfirmDelivery, useReleaseFunds } from "@/hooks/useContracts";
import { EscrowStatus, EscrowStatusLabel } from "@/types";

interface Props {
  escrowId: bigint;
  role: "shipper" | "carrier";
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
            disabled={isReleasing}
            className="btn-secondary"
          >
            {isReleasing ? "Releasing..." : "Release Funds"}
          </button>
        )}
      </div>
    </div>
  );
}
