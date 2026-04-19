'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { parseI18nField } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  channelCount: number;
}

export function CategoriesView({ categories }: { categories: Category[] }) {
  const { t, language } = useI18n();
  const { setCurrentView, setSelectedCategorySlug } = useAppStore();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('categories.allCategories')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const displayName = parseI18nField(cat.name, language);
          return (
            <Card
              key={cat.id}
              className="cursor-pointer hover:shadow-md hover:border-[#229ED9]/30 transition-all"
              onClick={() => { setSelectedCategorySlug(cat.slug); setCurrentView('home'); }}
            >
              <CardContent className="flex items-center gap-4 pt-4 pb-4 px-4">
                <span className="text-3xl">{cat.icon || '📁'}</span>
                <div>
                  <div className="font-semibold">{displayName || cat.slug}</div>
                  <div className="text-sm text-muted-foreground">{cat.channelCount} {t('categories.channelCount')}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
