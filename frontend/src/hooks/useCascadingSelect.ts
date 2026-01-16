import { useState, useEffect } from "react";

export function useCascadingSelect<T extends { id: number }>(
  parentValue: number | null,
  fetchFn: (parentId: number) => Promise<T[]>,
  onError?: (error: Error) => void
) {
  const [value, setValue] = useState<number | null>(null);
  const [options, setOptions] = useState<T[]>([]);

  useEffect(() => {
    if (parentValue) {
      fetchFn(parentValue)
        .then((data) => {
          setOptions(data);
          // Reset value if no longer valid
          setValue((current) => {
            if (current && !data.some((d) => d.id === current)) {
              return null;
            }
            return current;
          });
        })
        .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));
    } else {
      setOptions([]);
      setValue(null);
    }
  }, [parentValue, fetchFn, onError]);

  return { value, setValue, options };
}
