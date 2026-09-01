"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DepositDialog } from "./DepositDialog";

type Props = {
  listingId: string;
  listingTitle: string;
  depositPaisa: number;
  isAuthenticated: boolean;
};

export function DepositCTA({
  listingId,
  listingTitle,
  depositPaisa,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/listing/${listingId}?deposit=1`);
      router.push(`/login?next=${next}`);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button size="lg" className="sm:w-auto w-full" onClick={handleClick}>
        <Lock className="w-4 h-4" />
        {isAuthenticated ? "Reserve & Deposit" : "Sign in to Reserve"}
      </Button>
      <DepositDialog
        open={open}
        onClose={() => setOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
        depositPaisa={depositPaisa}
      />
    </>
  );
}
