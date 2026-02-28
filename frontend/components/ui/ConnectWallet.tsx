"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // ---- Connected state: address dropdown ----
  if (isConnected && address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm text-neutral-200 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-xs">{shortenAddress(address)}</span>
          <svg
            className="w-3 h-3 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-neutral-900 border border-neutral-800 shadow-xl z-50 py-1">
            <button
              onClick={copyAddress}
              className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy Address"}
            </button>
            <div className="border-t border-neutral-800 my-1" />
            <button
              onClick={() => {
                disconnect();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- Disconnected state: connect button + modal ----
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-neutral-100">
                Connect Wallet
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-neutral-300 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowModal(false);
                  }}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-800 text-sm text-neutral-200 transition-colors disabled:opacity-50"
                >
                  <span className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-xs">
                    {connector.name === "MetaMask"
                      ? "🦊"
                      : connector.name === "WalletConnect"
                        ? "🔗"
                        : connector.name === "Coinbase Wallet"
                          ? "🔵"
                          : "◈"}
                  </span>
                  <span>{connector.name}</span>
                </button>
              ))}
            </div>
            {isPending && (
              <p className="text-xs text-neutral-500 mt-4 text-center">
                Connecting...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
