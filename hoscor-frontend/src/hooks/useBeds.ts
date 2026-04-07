import { useQuery } from '@tanstack/react-query'
import { fetchBedsSummary, fetchUnitBeds } from '../api/beds'

export function useBedsSummary() {
  return useQuery({
    queryKey: ['beds-summary'],
    queryFn: fetchBedsSummary,
    refetchInterval: 30_000
  })
}

export function useUnitBeds(unit: string) {
  return useQuery({
    queryKey: ['unit-beds', unit],
    queryFn: () => fetchUnitBeds(unit),
    enabled: !!unit,
    refetchInterval: 30_000
  })
}
