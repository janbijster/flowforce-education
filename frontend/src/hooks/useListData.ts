import { useState, useEffect, useCallback } from "react";

interface UseListDataOptions<T, F = Record<string, unknown>> {
  fetchFn: (filters?: F) => Promise<T[]>;
  initialFilters?: F;
  errorMessage: string;
}

interface UseListDataResult<T, F> {
  data: T[];
  loading: boolean;
  error: string | null;
  filters: F;
  setFilters: React.Dispatch<React.SetStateAction<F>>;
  refresh: () => Promise<void>;
}

export function useListData<T, F = Record<string, unknown>>(
  options: UseListDataOptions<T, F>
): UseListDataResult<T, F> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<F>(options.initialFilters ?? {} as F);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await options.fetchFn(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : options.errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, options.fetchFn, options.errorMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, filters, setFilters, refresh: loadData };
}
