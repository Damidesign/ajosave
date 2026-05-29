"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ContributeButton({ circleId }: { circleId: string }) {
  const [loading, setLoading] = useState(false);
  const [feeInfo, setFeeInfo] = useState<{ authorizationUrl: string; platformFee: number } | null>(null);
  const { toast } = useToast();

  const handleContribute = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/contribute`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Show fee info before redirecting
      if (json.data.platformFee > 0) {
        setFeeInfo(json.data);
        setLoading(false);
        return;
      }
      toast("Redirecting to payment…", "info");
      window.location.href = json.data.authorizationUrl;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to initiate payment", "error");
      setLoading(false);
    }
  };

  if (feeInfo) {
    const feeNgn = (feeInfo.platformFee / 100).toFixed(2);
    return (
      <div role="region" aria-label="Payment fee disclosure" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          A platform fee of <strong>₦{feeNgn}</strong> (0.5%) will be added to your contribution.
        </p>
        <Button
          variant="accent"
          onClick={() => {
            toast("Redirecting to payment…", "info");
            window.location.href = feeInfo.authorizationUrl;
          }}
        >
          Proceed to Payment
        </Button>
        <Button variant="ghost" onClick={() => setFeeInfo(null)}>Cancel</Button>
      </div>
    );
  }

  return (
    <Button variant="accent" onClick={handleContribute} loading={loading}>
      Contribute Now
    </Button>
  );
}
