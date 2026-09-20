import { useEffect, useState } from "react";
import { resolveContinuationRoute } from "@/utils/pidApi";
import type { Departure } from "@/types/pid";

const CANDIDATES = ["301", "352"];

/**
 * Linka, jako kterou 174 pokračuje z Luk. Když se konkrétní spoj nepodaří
 * určit, zůstane obecné „301/352".
 */
export const LukaContinuation = ({ departure }: { departure: Departure }) => {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRoute(null);
    resolveContinuationRoute(departure, CANDIDATES).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => { cancelled = true; };
  }, [departure.trip_id, departure.vehicle_number]);

  return <span className="text-orange-600 font-medium">{route ?? CANDIDATES.join("/")}</span>;
};
