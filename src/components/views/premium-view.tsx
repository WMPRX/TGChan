'use client';

import { useI18n } from '@/lib/i18n/context';
import { parseI18nField, parseFeatures } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Crown, Check, X, TrendingUp, Users, BarChart3 } from 'lucide-react';

export function PremiumView({ plans }: { plans: Array<{ id: number; name: string; slug: string; price: number; durationDays: number; features: string | null }> }) {
  const { t, language } = useI18n();

  return (
    <div>
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 py-16">
        <div className="mx-auto max-w-4xl text-center px-4">
          <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('premium.title')}</h1>
          <p className="text-lg text-muted-foreground mb-8">{t('premium.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /><span>{t('premium.featureVisibility')}</span></div>
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-[#229ED9]" /><span>{t('premium.featureMembers')}</span></div>
            <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-500" /><span>{t('premium.featureAnalytics')}</span></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = parseFeatures(plan.features);
            const isPopular = plan.slug === 'gold';
            return (
              <Card key={plan.id} className={`relative ${isPopular ? 'border-2 border-amber-500 shadow-lg' : ''}`}>
                {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</div>}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{parseI18nField(plan.name, language) || plan.slug}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.durationDays}d</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{t('premium.topPosition')}</li>
                    <li className="flex items-center gap-2">{features.featuredBadge ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}{t('premium.featuredBadge')}</li>
                    <li className="flex items-center gap-2">{features.highlightColor ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}{t('premium.highlightColor')}</li>
                    <li className="flex items-center gap-2">{features.bannerSlot ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}{t('premium.sponsoredBanner')}</li>
                    <li className="flex items-center gap-2">{features.priorityInCategory ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}{t('premium.categoryPriority')}</li>
                    <li className="flex items-center gap-2">{features.detailedStats ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}{t('premium.detailedStats')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground">{t('premium.maxChannels')}: {String(features.maxChannels ?? 1)}</li>
                  </ul>
                  <Button className={`w-full mt-4 ${isPopular ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#229ED9] hover:bg-[#1a8bc4]'}`}>
                    {t('premium.buyNow')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
