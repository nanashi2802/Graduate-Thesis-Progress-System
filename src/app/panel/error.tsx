"use client";
// R2.8 (UX-026): a server error in this portal stays inside the shell. It names what failed and offers Try again.
// No stack trace and no digest on the screen.
import { SegmentError } from "@/components/patterns/error";

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError reset={reset} />;
}
