import { useQuery } from '@tanstack/react-query'
import { fetchOverview } from '../api/dashboard'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchOverview,
    refetchInterval: 30_000,
    retry: 1,
    refetchIntervalInBackground: false,
  })
}
