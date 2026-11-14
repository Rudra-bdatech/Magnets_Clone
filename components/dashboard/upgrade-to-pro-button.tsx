"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * "Upgrade to Pro" — goes straight to the Chargebee payment page for Pro monthly (₹299/month),
 * the same way the custom domain unlock goes straight to Chargebee. No in-between page.
 */
export default function UpgradeToProButton({
  className,
  children,
  errorClassName = "mt-2 text-xs text-red-600 dark:text-red-400",
}: {
  className: string;
  children: React.ReactNode;
  errorClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  // Back button from Chargebee restores this page from the bfcache with the spinner still on
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        inFlight.current = false;
        setLoading(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const start = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/chargebee/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "pro_monthly" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't open the payment page. Please try again.");

      // Sandbox only (ALLOW_SIMULATED_BILLING and no Chargebee keys): simulate the payment
      if (data.isSimulated) {
        const sim = await fetch("/api/billing/chargebee/simulate-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSimulated: true, product: "pro_monthly" }),
        });
        if (!sim.ok) throw new Error("Sandbox payment failed.");
        window.location.reload();
        return;
      }

      if (!data.checkoutUrl) throw new Error("Couldn't open the payment page. Please try again.");
      // Keep the button disabled until the browser leaves, so a second click can't open another checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
      inFlight.current = false;
    }
  };

  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={start} disabled={loading} className={`${className} disabled:opacity-70 cursor-pointer`}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening secure payment…
          </>
        ) : (
          children
        )}
      </button>
      {error && (
        <span role="alert" className={errorClassName}>
          {error}
        </span>
      )}
    </span>
  );
}
