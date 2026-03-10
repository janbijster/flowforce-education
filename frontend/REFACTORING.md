# Frontend Refactoring Plan

This document outlines a phased approach to refactoring the frontend codebase to reduce code duplication and improve maintainability.

## Current State

- ~6,390 lines across page components
- Estimated 40-50% duplication
- 5 list pages, 4 detail pages, 5+ editor pages with similar patterns

## Phase 1: Core Components (High Impact)

### 1.1 Create `<LoadingError>` Component

**Location:** `src/components/LoadingError.tsx`

Consolidates the loading/error state handling that appears in 15+ locations.

```tsx
interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  title: string;
  children: React.ReactNode;
}

export function LoadingError({ loading, error, title, children }: LoadingErrorProps) {
  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{title}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{title}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error}</p>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
```

**Files to update:** Students.tsx, StudentGroups.tsx, Quizzes.tsx, Questions.tsx, MaterialsOverview.tsx, StudentDetail.tsx, QuizDetail.tsx, StudentGroupDetail.tsx, QuestionDetail.tsx

### 1.2 Create `<FilterSelect>` Component

**Location:** `src/components/FilterSelect.tsx`

Consolidates the filter dropdown pattern that appears 20+ times.

```tsx
interface FilterSelectProps<T extends { id: number; name: string }> {
  label: string;
  value: number | null;
  options: T[];
  onChange: (id: number | null) => void;
  allLabel: string;
  disabled?: boolean;
  displayFn?: (item: T) => string;
}

export function FilterSelect<T extends { id: number; name: string }>({
  label,
  value,
  options,
  onChange,
  allLabel,
  disabled = false,
  displayFn = (item) => item.name,
}: FilterSelectProps<T>) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {displayFn(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## Phase 2: Custom Hooks (High Impact)

### 2.1 Create `useListData` Hook

**Location:** `src/hooks/useListData.ts`

Consolidates the data fetching pattern used in all list pages.

```tsx
interface UseListDataOptions<T, F = any> {
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

export function useListData<T, F = any>(
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
```

### 2.2 Create `useCascadingSelect` Hook

**Location:** `src/hooks/useCascadingSelect.ts`

Handles the dependent dropdown cascade pattern used in Questions, QuizEditor, MaterialForm, etc.

```tsx
interface CascadeLevel<T> {
  value: number | null;
  setValue: (val: number | null) => void;
  options: T[];
  setOptions: (opts: T[]) => void;
  fetchFn: (parentId: number) => Promise<T[]>;
}

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
        .catch((err) => onError?.(err));
    } else {
      setOptions([]);
      setValue(null);
    }
  }, [parentValue, fetchFn, onError]);

  return { value, setValue, options };
}
```

---

## Phase 3: Layout Components (Medium Impact)

### 3.1 Create `<ListPageLayout>` Component

**Location:** `src/components/layouts/ListPageLayout.tsx`

Wraps list pages with consistent header and action buttons.

```tsx
interface ListPageLayoutProps {
  title: string;
  newButtonLabel?: string;
  onNew?: () => void;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export function ListPageLayout({
  title,
  newButtonLabel,
  onNew,
  filters,
  children,
}: ListPageLayoutProps) {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{title}</PageHeaderHeading>
        {onNew && newButtonLabel && (
          <Button onClick={onNew}>{newButtonLabel}</Button>
        )}
      </PageHeader>
      {filters && <div className="mb-4 flex flex-wrap gap-4">{filters}</div>}
      {children}
    </>
  );
}
```

### 3.2 Create `<DetailPageLayout>` Component

**Location:** `src/components/layouts/DetailPageLayout.tsx`

```tsx
interface DetailPageLayoutProps {
  title: string;
  actions?: Array<{ label: string; onClick: () => void; variant?: "default" | "outline" }>;
  children: React.ReactNode;
}

export function DetailPageLayout({ title, actions, children }: DetailPageLayoutProps) {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{title}</PageHeaderHeading>
        {actions && (
          <div className="flex gap-2">
            {actions.map((action, idx) => (
              <Button key={idx} onClick={action.onClick} variant={action.variant || "outline"}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </PageHeader>
      {children}
    </>
  );
}
```

---

## Phase 4: Utility Components (Lower Impact)

### 4.1 Create `<DataTable>` Component

**Location:** `src/components/DataTable.tsx`

Wraps the shadcn Table with consistent styling and row click handling.

```tsx
interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  keyFn: (item: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage,
  keyFn,
}: DataTableProps<T>) {
  // Implementation with Table, TableHeader, TableBody, etc.
}
```

### 4.2 Create `<DetailInfoCard>` Component

**Location:** `src/components/DetailInfoCard.tsx`

```tsx
interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailInfoCardProps {
  title: string;
  fields: DetailField[];
}

export function DetailInfoCard({ title, fields }: DetailInfoCardProps) {
  return (
    <div className="rounded-md border p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={idx}>
            <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
            <p className="mt-1">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 5: Utility Consolidation (Cleanup)

### 5.1 Consolidate localStorage Helpers

Current `lib/utils.ts` has repetitive get/set functions. Consolidate to:

```tsx
function getStorageValue(key: string): number | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? null : parsed;
}

function setStorageValue(key: string, value: number | null): void {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value.toString());
  }
}

// Then use:
export const getLastCourse = () => getStorageValue('lastCourse');
export const setLastCourse = (v: number | null) => setStorageValue('lastCourse', v);
// etc.
```

### 5.2 Create Question Type Utilities

**Location:** `src/lib/questionTypes.ts`

```tsx
export function getQuestionTypePath(type: string): string {
  const typeMap: Record<string, string> = {
    multiple_choice: 'multiple-choice',
    order: 'order',
    connect: 'connect',
    number: 'number',
  };
  return typeMap[type] || 'multiple-choice';
}

export function getOptionCount(question: any): number {
  switch (question.question_type) {
    case 'multiple_choice':
      return question.options_count || 0;
    case 'order':
      return question.order_options_count || 0;
    case 'connect':
      return question.connect_options_count || 0;
    default:
      return 0;
  }
}
```

---

## Implementation Order

1. **Week 1:** Phase 1 (LoadingError, FilterSelect) - immediate impact on all pages
2. **Week 2:** Phase 2 (useListData, useCascadingSelect) - reduces boilerplate significantly
3. **Week 3:** Phase 3 (Layout components) - consistency across pages
4. **Week 4:** Phase 4-5 (DataTable, utilities) - polish and cleanup

## Expected Results

- **Before:** ~6,390 lines in pages/
- **After:** ~3,000-3,500 lines in pages/
- **New shared code:** ~500-600 lines in components/ and hooks/
- **Net reduction:** ~2,500 lines with better maintainability

## Migration Strategy

For each refactored page:
1. Create the new shared component/hook
2. Migrate ONE page to use it (e.g., Students.tsx)
3. Verify functionality with manual testing
4. Migrate remaining similar pages
5. Remove any dead code
