"use client";

import { Button } from "@bba/ui";
import { useCatalogueNavigation } from "./catalogue-navigation";

/** The empty state's one action. */
export function ClearFiltersButton({ label }: { label: string }) {
  const { clearFilters } = useCatalogueNavigation();
  return <Button variant="secondary" onClick={clearFilters}>{label}</Button>;
}
