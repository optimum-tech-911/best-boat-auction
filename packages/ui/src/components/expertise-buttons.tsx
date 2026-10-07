"use client";

import { MapPin, Video } from "lucide-react";
import { Button } from "./button";
import { cx } from "./primitives";

interface ExpertiseButtonsProps {
  label: string;
  digital: string;
  physical: string;
  digitalAccessibleLabel: string;
  physicalAccessibleLabel: string;
  onDigital: () => void;
  onPhysical: () => void;
  compact?: boolean;
}

/** Two C-01 controls, kept above the photography so neither the boat nor its watch action is covered. */
export function ExpertiseButtons({ label, digital, physical, digitalAccessibleLabel, physicalAccessibleLabel, onDigital, onPhysical, compact = false }: ExpertiseButtonsProps) {
  return (
    <div role="group" aria-label={label} className={cx("relative z-raised flex flex-wrap gap-2", compact && "grid grid-cols-2")}>
      <Button variant="primary" size="sm" icon={Video} aria-label={digitalAccessibleLabel} onClick={onDigital} fullWidth={compact}>{digital}</Button>
      <Button variant="secondary" size="sm" icon={MapPin} aria-label={physicalAccessibleLabel} onClick={onPhysical} fullWidth={compact} className="bg-white">{physical}</Button>
    </div>
  );
}
