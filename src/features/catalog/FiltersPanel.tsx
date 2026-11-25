import { CATEGORIES, type Category } from '../../api/contract';
import { CATEGORY_META } from './categories';
import type { CatalogFilters } from './useCatalogFilters';

type Props = {
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
};

const chip =
  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-transparent transition hover:bg-slate-100 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800 has-[:checked]:ring-brand-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600';

/** Native radio/checkbox inputs, so keyboard and screen-reader support come for free. */
export function FiltersPanel({ filters, onChange }: Props) {
  const options: Array<{ value: Category | null; label: string }> = [
    { value: null, label: 'All products' },
    ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].label })),
  ];

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
          Category
        </legend>
        <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {options.map((option) => {
            const Icon = option.value ? CATEGORY_META[option.value].icon : null;
            return (
              <label key={option.label} className={`${chip} shrink-0`}>
                <input
                  type="radio"
                  name="category"
                  className="sr-only"
                  checked={filters.category === option.value}
                  onChange={() => onChange({ category: option.value })}
                />
                {Icon && <Icon className="size-4" aria-hidden="true" />}
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
          Availability
        </legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="accent-brand-600 size-4 rounded border-slate-300"
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
          />
          In stock only
        </label>
      </fieldset>
    </div>
  );
}
