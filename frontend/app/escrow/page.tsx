"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { formatUSDC, CONTRACTS } from "@/lib/config";
import {
  useUSDCBalance,
  useShipperEscrows,
  useCarrierEscrows,
  useApproveToken,
  useCreateEscrow,
} from "@/hooks/useContracts";
import { EscrowCard } from "@/components/escrow/EscrowCard";

type View = "shipper" | "carrier" | "create";

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<View>("shipper");

  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: shipperEscrows } = useShipperEscrows(address);
  const { data: carrierEscrows } = useCarrierEscrows(address);

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400 mb-4">
          Connect wallet to continue
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Freight Escrow</h1>
        <p className="text-xs text-neutral-500">
          Wallet: {usdcBalance ? formatUSDC(usdcBalance) : "0"} USDC
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <TabButton
          active={view === "shipper"}
          onClick={() => setView("shipper")}
        >
          As Shipper ({shipperEscrows?.length || 0})
        </TabButton>
        <TabButton
          active={view === "carrier"}
          onClick={() => setView("carrier")}
        >
          As Carrier ({carrierEscrows?.length || 0})
        </TabButton>
        <TabButton active={view === "create"} onClick={() => setView("create")}>
          + Create Escrow
        </TabButton>
      </div>

      {/* Content */}
      {view === "shipper" && (
        <EscrowList ids={shipperEscrows || []} role="shipper" />
      )}
      {view === "carrier" && (
        <EscrowList ids={carrierEscrows || []} role="carrier" />
      )}
      {view === "create" && (
        <CreateEscrowForm onSuccess={() => setView("shipper")} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? "tab-active" : "tab-inactive"}
    >
      {children}
    </button>
  );
}

function EscrowList({
  ids,
  role,
}: {
  ids: readonly bigint[];
  role: "shipper" | "carrier";
}) {
  if (!ids || ids.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-neutral-500">No escrows found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ids.map((id) => (
        <EscrowCard key={id.toString()} escrowId={id} role={role} />
      ))}
    </div>
  );
}

function CreateEscrowForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    carrier: "",
    amount: "",
    shipmentId: "",
    origin: "",
    destination: "",
  });

  const {
    approve,
    isPending: isApproving,
    isSuccess: approved,
  } = useApproveToken(CONTRACTS.usdc);
  const {
    create,
    isPending: isCreating,
    isConfirming,
    isSuccess,
  } = useCreateEscrow();

  const handleApprove = () => {
    if (form.amount) {
      approve(CONTRACTS.freightEscrow, form.amount);
    }
  };

  const handleCreate = () => {
    create(
      form.carrier as `0x${string}`,
      form.amount,
      form.shipmentId,
      form.origin,
      form.destination,
    );
  };

  if (isSuccess) {
    onSuccess();
  }

  return (
    <div className="card max-w-xl">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
        New Freight Escrow
      </p>

      <div className="space-y-4">
        <div>
          <label className="label">Carrier Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={form.carrier}
            onChange={(e) => setForm({ ...form, carrier: e.target.value })}
            className="input font-mono"
          />
        </div>

        <div>
          <label className="label">Amount (USDC)</label>
          <input
            type="number"
            placeholder="10000.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input tabular-nums"
          />
        </div>

        <div>
          <label className="label">Shipment ID</label>
          <input
            type="text"
            placeholder="SHP-2024-001"
            value={form.shipmentId}
            onChange={(e) => setForm({ ...form, shipmentId: e.target.value })}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Origin</label>
            <input
              type="text"
              placeholder="Rotterdam, NL"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Destination</label>
            <input
              type="text"
              placeholder="Munich, DE"
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {!approved ? (
            <button
              onClick={handleApprove}
              disabled={!form.amount || isApproving}
              className="btn-secondary flex-1"
            >
              {isApproving ? "Approving..." : "1. Approve USDC"}
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={
                !form.carrier || !form.amount || isCreating || isConfirming
              }
              className="btn-primary flex-1"
            >
              {isCreating || isConfirming ? "Creating..." : "2. Create Escrow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
