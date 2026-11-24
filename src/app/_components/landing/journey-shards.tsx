"use client";

/*
 * Background of the Thesis Journey section: React Bits Aero Shards as clear glass with a light
 * red tint on the white page. Loaded on the client only, so vgpu stays out of the first bundle.
 * Count 1000, default spread and placement, no markers, no pulse on click and no hold to
 * gather. The three nearest ribbons start further apart: the middle, the bottom and the top
 * of the left edge (owner, 25 Nov 2026).
 */
import dynamic from "next/dynamic";

const AeroShards = dynamic(() => import("./aero-shards"), { ssr: false });

// Start (left) and end (right) height of each ribbon, nearest first: -1 is the bottom edge and
// 1 the top edge. React Bits default: [0.2,-0.78] [-0.72,0.02] [0.58,-0.06] [-0.24,0.62] [0.8,0.3].
// The default already starts the three nearest ribbons near the middle, bottom and top; this
// spreads those starts further apart. The ends and the two far ribbons stay default.
const SLOPES = [
  [0.05, -0.78],
  [-0.85, 0.02],
  [0.85, -0.06],
  [-0.24, 0.62],
  [0.8, 0.3],
];

export function JourneyShards({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <AeroShards
        lightMode
        material="glass"
        shardColor="#f1d3d6"
        accentColor="#e26674"
        count={1000}
        slopes={SLOPES}
        markers="none"
        pulseOnClick={false}
        holdToGather={false}
      />
    </div>
  );
}
