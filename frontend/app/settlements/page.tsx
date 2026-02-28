"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUSDC, CONTRACTS } from "@/lib/config";
import {
  useUSDCBalance,
  useShipperEscrows,
  useCarrierEscrows,
  useApproveToken,
  useCreateEscrow,
  useEscrowCount,
} from "@/hooks/useContracts";
import { EscrowCard } from "@/components/escrow/EscrowCard";

// ============ Mock Settlement History ============

const MOCK_SETTLEMENTS = [
  {
    id: "stl-1",
    type: "FX Settlement",
    from: "USDC",
    to: "EURC",
    amount: 25000,
    rate: "0.9200",
    status: "Completed",
    date: new Date(Date.now() - 2 * 3600 * 1000).toLocaleDateString("en-GB"),
    txHash: "0x1a2b3c...7890",
  },
  {
    id: "stl-2",
    type: "Escrow Release",
    from: "Escrow #3",
    to: "Carrier",
    amount: 12500,
    rate: "—",
    status: "Completed",
    date: new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString("en-GB"),
    txHash: "0x2b3c4d...90ab",
  },
  {
    id: "stl-3",
    type: "Cross-chain",
    from: "Arc",
    to: "Ethereum",
    amount: 50000,
    rate: "—",
    status: "Pending",
    date: new Date(Date.now() - 1 * 3600 * 1000).toLocaleDateString("en-GB"),
    txHash: "0x3c4d5e...abcd",
  },
  {
    id: "stl-4",
    type: "FX Settlement",
    from: "EURC",
    to: "USDC",
    amount: 10000,
    rate: "1.0870",
    status: "Completed",
    date: new Date(Date.now() - 72 * 3600 * 1000).toLocaleDateString("en-GB"),
    txHash: "0x4d5e6f...cde1",
  },
  {
    id: "stl-5",
    type: "Escrow Release",
    from: "Escrow #1",
    to: "Carrier",
    amount: 8500,
    rate: "—",
    status: "Completed",
    date: new Date(Date.now() - 96 * 3600 * 1000).toLocaleDateString("en-GB"),
    txHash: "0x5e6f78...ef12",
  },
];

// ============ Types ============

type Tab = "obligations" | "locked" | "history" | "create";

// ============ Component ============

export default function SettlementsPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("obligations");

  const { data: usdcBalance, isLoading: balanceLoading } =
    useUSDCBalance(address);
  const { data: shipperEscrows, isLoading: shipperLoading } =
    useShipperEscrows(address);
  const { data: carrierEscrows, isLoading: carrierLoading } =
    useCarrierEscrows(address);
  const { data: escrowCount, isLoading: countLoading } = useEscrowCount();

  const totalObligations =
    (shipperEscrows?.length || 0) + (carrierEscrows?.length || 0);

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
        <h1 className="text-sm font-medium text-neutral-100">
          Settlements & Escrows
        </h1>
        {balanceLoading ? (
          <Skeleton className="h-4 w-24 bg-neutral-800" />
        ) : (
          <p className="text-xs text-neutral-500">
            Wallet: {usdcBalance ? formatUSDC(usdcBalance) : "0"} USDC
          </p>
        )}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Total Escrows</p>
          {countLoading ? (
            <Skeleton className="h-7 w-8 bg-neutral-800" />
          ) : (
            <p className="kpi-value">{escrowCount?.toString() || "0"}</p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">As Shipper</p>
          {shipperLoading ? (
            <Skeleton className="h-7 w-8 bg-neutral-800" />
          ) : (
            <p className="kpi-value">{shipperEscrows?.length || 0}</p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">As Carrier</p>
          {carrierLoading ? (
            <Skeleton className="h-7 w-8 bg-neutral-800" />
          ) : (
            <p className="kpi-value">{carrierEscrows?.length || 0}</p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Pending Settlements</p>
          <p className="kpi-value text-amber-400">
            {MOCK_SETTLEMENTS.filter((s) => s.status === "Pending").length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {[
          {
            id: "obligations" as Tab,
            label: `Obligations (${totalObligations})`,
          },
          { id: "locked" as Tab, label: "Locked Funds" },
          { id: "history" as Tab, label: "Release History" },
          { id: "create" as Tab, label: "+ Create Escrow" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "tab-active" : "tab-inactive"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "obligations" && (
        <PaymentObligations
          shipperEscrows={shipperEscrows || []}
          carrierEscrows={carrierEscrows || []}
          shipperLoading={shipperLoading}
          carrierLoading={carrierLoading}
        />
      )}
      {activeTab === "locked" && (
        <LockedFunds
          shipperEscrows={shipperEscrows || []}
          isLoading={shipperLoading}
        />
      )}
      {activeTab === "history" && <ReleaseHistory />}
      {activeTab === "create" && (
        <CreateEscrowForm onSuccess={() => setActiveTab("obligations")} />
      )}
    </div>
  );
}

// ============ Sub-Components ============

function PaymentObligations({
  shipperEscrows,
  carrierEscrows,
  shipperLoading,
  carrierLoading,
}: {
  shipperEscrows: readonly bigint[];
  carrierEscrows: readonly bigint[];
  shipperLoading: boolean;
  carrierLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Outgoing Obligations (As Shipper) */}
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
          ↑ Outgoing — Funds you owe (as Shipper)
        </p>
        {shipperLoading ? (
          <div className="space-y-3">
            <EscrowCardSkeleton />
            <EscrowCardSkeleton />
          </div>
        ) : shipperEscrows.length === 0 ? (
          <div className="card">
            <p className="text-sm text-neutral-500">No outgoing obligations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipperEscrows.map((id) => (
              <EscrowCard key={id.toString()} escrowId={id} role="shipper" />
            ))}
          </div>
        )}
      </div>

      {/* Incoming Obligations (As Carrier) */}
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
          ↓ Incoming — Funds owed to you (as Carrier)
        </p>
        {carrierLoading ? (
          <div className="space-y-3">
            <EscrowCardSkeleton />
          </div>
        ) : carrierEscrows.length === 0 ? (
          <div className="card">
            <p className="text-sm text-neutral-500">No incoming obligations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {carrierEscrows.map((id) => (
              <EscrowCard key={id.toString()} escrowId={id} role="carrier" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LockedFunds({
  shipperEscrows,
  isLoading,
}: {
  shipperEscrows: readonly bigint[];
  isLoading: boolean;
}) {
  return (
    <div>
      <div className="card bg-gradient-to-br from-amber-950/20 to-neutral-900 border-amber-800/20 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-amber-400">⚿</span>
          <p className="text-xs text-amber-400 uppercase tracking-wider font-medium">
            Locked in Escrow
          </p>
        </div>
        <p className="text-xs text-neutral-400">
          These funds are locked in smart contract escrows and earning USYC
          yield until delivery is confirmed. Funds are released when GPS
          verification and carrier signature conditions are met.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <EscrowCardSkeleton />
          <EscrowCardSkeleton />
        </div>
      ) : shipperEscrows.length === 0 ? (
        <div className="card">
          <p className="text-sm text-neutral-500">No funds currently locked</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipperEscrows.map((id) => (
            <EscrowCard key={id.toString()} escrowId={id} role="shipper" />
          ))}
        </div>
      )}
    </div>
  );
}

function ReleaseHistory() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-neutral-100">
          Release History
        </h2>
        <span className="text-xs text-neutral-500">Last 30 days</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                From → To
              </th>
              <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                Amount
              </th>
              <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                Rate
              </th>
              <th className="text-center py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                Status
              </th>
              <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                Tx
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SETTLEMENTS.map((s) => (
              <tr
                key={s.id}
                className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
              >
                <td className="py-2.5 px-2 text-neutral-300">{s.date}</td>
                <td className="py-2.5 px-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
                      s.type === "FX Settlement"
                        ? "bg-blue-500/10 text-blue-400"
                        : s.type === "Escrow Release"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-neutral-400">
                  {s.from} → {s.to}
                </td>
                <td className="py-2.5 px-2 text-right text-neutral-200 font-mono">
                  ${s.amount.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-right text-neutral-400 font-mono">
                  {s.rate}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      s.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <a
                    href={`https://testnet.arcscan.app/tx/${s.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-[10px]"
                  >
                    {s.txHash}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EscrowCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32 bg-neutral-800" />
        <Skeleton className="h-5 w-20 bg-neutral-800" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24 bg-neutral-800" />
          <Skeleton className="h-4 w-32 bg-neutral-800" />
        </div>
        <Skeleton className="h-8 w-full bg-neutral-800 mt-4" />
      </div>
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
