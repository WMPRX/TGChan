'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { parseI18nField } from '@/lib/helpers';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  channelCount: number;
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { t, language } = useI18n();
  const { setCurrentView, setSelectedCategorySlug } = useAppStore();

  const handleClick = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('home');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <h2 className="text-2xl font-bold mb-6">{t('home.popularCategories')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category) => {
          const displayName = parseI18nField(category.name, language);

          return (
            <button
              key={category.id}
              onClick={() => handleClick(category.slug)}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-md hover:border-[#229ED9]/30 hover:scale-[1.02] transition-all duration-200"
            >
              <span className="text-2xl">{category.icon || '📁'}</span>
              <span className="text-sm font-medium text-center leading-tight">{displayName}</span>
              <span className="text-xs text-muted-foreground">{category.channelCount} {t('categories.channelCount')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
