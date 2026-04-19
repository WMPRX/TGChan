// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

// Structural seed - categories, plans, settings, admin user (NO demo channels)
async function main() {
  const existingChannels = await db.channel.count();
  if (existingChannels > 0) {
    console.log('Database already has data, channelCount:', existingChannels);
    console.log('Skipping structural seed. Use admin panel to add channels.');
    return;
  }

  const DEMO_PASSWORD_HASH = '$2b$12$G6q09hy66jEO3j3Rm49kC.7rGpbceQ2yq2AbT/tVwbnc19Rk/OZM6';

  // Categories with proper i18n (10 languages)
  const categoriesData = [
    { name: JSON.stringify({ en: 'Entertainment', tr: 'Eğlence', ru: 'Развлечения', zh: '娱乐', id: 'Hiburan', vi: 'Giải trí', es: 'Entretenimiento', ar: 'ترفيه', de: 'Unterhaltung', fr: 'Divertissement' }), slug: 'entertainment', icon: '🎬', order: 1, channelCount: 0 },
    { name: JSON.stringify({ en: 'Technology', tr: 'Teknoloji', ru: 'Технологии', zh: '科技', id: 'Teknologi', vi: 'Công nghệ', es: 'Tecnología', ar: 'تكنولوجيا', de: 'Technologie', fr: 'Technologie' }), slug: 'technology', icon: '💻', order: 2, channelCount: 0 },
    { name: JSON.stringify({ en: 'News', tr: 'Haberler', ru: 'Новости', zh: '新闻', id: 'Berita', vi: 'Tin tức', es: 'Noticias', ar: 'أخبار', de: 'Nachrichten', fr: 'Actualités' }), slug: 'news', icon: '📰', order: 3, channelCount: 0 },
    { name: JSON.stringify({ en: 'Education', tr: 'Eğitim', ru: 'Образование', zh: '教育', id: 'Pendidikan', vi: 'Giáo dục', es: 'Educación', ar: 'تعليم', de: 'Bildung', fr: 'Éducation' }), slug: 'education', icon: '📚', order: 4, channelCount: 0 },
    { name: JSON.stringify({ en: 'Crypto', tr: 'Kripto', ru: 'Крипто', zh: '加密货币', id: 'Kripto', vi: 'Tiền điện tử', es: 'Cripto', ar: 'عملات رقمية', de: 'Krypto', fr: 'Crypto' }), slug: 'crypto', icon: '🪙', order: 5, channelCount: 0 },
    { name: JSON.stringify({ en: 'Gaming', tr: 'Oyun', ru: 'Игры', zh: '游戏', id: 'Gaming', vi: 'Trò chơi', es: 'Juegos', ar: 'ألعاب', de: 'Spiele', fr: 'Jeux' }), slug: 'gaming', icon: '🎮', order: 6, channelCount: 0 },
    { name: JSON.stringify({ en: 'Music', tr: 'Müzik', ru: 'Музыка', zh: '音乐', id: 'Musik', vi: 'Âm nhạc', es: 'Música', ar: 'موسيقى', de: 'Musik', fr: 'Musique' }), slug: 'music', icon: '🎵', order: 7, channelCount: 0 },
    { name: JSON.stringify({ en: 'Sports', tr: 'Spor', ru: 'Спорт', zh: '体育', id: 'Olahraga', vi: 'Thể thao', es: 'Deportes', ar: 'رياضة', de: 'Sport', fr: 'Sports' }), slug: 'sports', icon: '⚽', order: 8, channelCount: 0 },
    { name: JSON.stringify({ en: 'Business', tr: 'İş Dünyası', ru: 'Бизнес', zh: '商业', id: 'Bisnis', vi: 'Kinh doanh', es: 'Negocios', ar: 'أعمال', de: 'Wirtschaft', fr: 'Affaires' }), slug: 'business', icon: '💼', order: 9, channelCount: 0 },
    { name: JSON.stringify({ en: 'Science', tr: 'Bilim', ru: 'Наука', zh: '科学', id: 'Sains', vi: 'Khoa học', es: 'Ciencia', ar: 'علوم', de: 'Wissenschaft', fr: 'Sciences' }), slug: 'science', icon: '🔬', order: 10, channelCount: 0 },
    { name: JSON.stringify({ en: 'Health', tr: 'Sağlık', ru: 'Здоровье', zh: '健康', id: 'Kesehatan', vi: 'Sức khỏe', es: 'Salud', ar: 'صحة', de: 'Gesundheit', fr: 'Santé' }), slug: 'health', icon: '🏥', order: 11, channelCount: 0 },
    { name: JSON.stringify({ en: 'Travel', tr: 'Seyahat', ru: 'Путешествия', zh: '旅行', id: 'Perjalanan', vi: 'Du lịch', es: 'Viajes', ar: 'سفر', de: 'Reisen', fr: 'Voyage' }), slug: 'travel', icon: '✈️', order: 12, channelCount: 0 },
    { name: JSON.stringify({ en: 'Food', tr: 'Yemek', ru: 'Еда', zh: '美食', id: 'Makanan', vi: 'Ẩm thực', es: 'Comida', ar: 'طعام', de: 'Essen', fr: 'Cuisine' }), slug: 'food', icon: '🍕', order: 13, channelCount: 0 },
    { name: JSON.stringify({ en: 'Art & Design', tr: 'Sanat & Tasarım', ru: 'Искусство', zh: '艺术', id: 'Seni & Desain', vi: 'Nghệ thuật', es: 'Arte y Diseño', ar: 'فن وتصميم', de: 'Kunst & Design', fr: 'Art et Design' }), slug: 'art', icon: '🎨', order: 14, channelCount: 0 },
    { name: JSON.stringify({ en: 'Movies & TV', tr: 'Film & Dizi', ru: 'Кино', zh: '电影', id: 'Film & TV', vi: 'Phim ảnh', es: 'Cine y TV', ar: 'أفلام وتلفزيون', de: 'Film & TV', fr: 'Cinéma et TV' }), slug: 'movies', icon: '🎥', order: 15, channelCount: 0 },
    { name: JSON.stringify({ en: 'Politics', tr: 'Siyaset', ru: 'Политика', zh: '政治', id: 'Politik', vi: 'Chính trị', es: 'Política', ar: 'سياسة', de: 'Politik', fr: 'Politique' }), slug: 'politics', icon: '🏛️', order: 16, channelCount: 0 },
  ];

  for (const cat of categoriesData) {
    await db.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log('Categories created:', categoriesData.length);

  const tagsData = [
    { name: JSON.stringify({ en: 'Popular', tr: 'Popüler', ru: 'Популярное', zh: '热门' }), slug: 'popular' },
    { name: JSON.stringify({ en: 'Verified', tr: 'Doğrulanmış', ru: 'Верифицировано', zh: '已认证' }), slug: 'verified' },
    { name: JSON.stringify({ en: 'Official', tr: 'Resmi', ru: 'Официальное', zh: '官方' }), slug: 'official' },
  ];
  for (const tag of tagsData) {
    await db.tag.upsert({ where: { slug: tag.slug }, update: {}, create: tag });
  }
  console.log('Tags created');

  const plansData = [
    { name: JSON.stringify({ en: 'Bronze', tr: 'Bronz' }), slug: 'bronze', durationDays: 7, price: 9.99, currency: 'USD', features: JSON.stringify({ listingPosition: 'top', featuredBadge: false, highlightColor: null, bannerSlot: false, priorityInCategory: false, detailedStats: false, maxChannels: 1 }), isActive: true, order: 1 },
    { name: JSON.stringify({ en: 'Silver', tr: 'Gümüş' }), slug: 'silver', durationDays: 30, price: 29.99, currency: 'USD', features: JSON.stringify({ listingPosition: 'top', featuredBadge: true, highlightColor: null, bannerSlot: false, priorityInCategory: true, detailedStats: false, maxChannels: 2 }), isActive: true, order: 2 },
    { name: JSON.stringify({ en: 'Gold', tr: 'Altın' }), slug: 'gold', durationDays: 90, price: 74.99, currency: 'USD', features: JSON.stringify({ listingPosition: 'top', featuredBadge: true, highlightColor: '#FFD700', bannerSlot: false, priorityInCategory: true, detailedStats: true, maxChannels: 3 }), isActive: true, order: 3 },
    { name: JSON.stringify({ en: 'Platinum', tr: 'Platin' }), slug: 'platinum', durationDays: 365, price: 249.99, currency: 'USD', features: JSON.stringify({ listingPosition: 'top', featuredBadge: true, highlightColor: '#E5E4E2', bannerSlot: true, priorityInCategory: true, detailedStats: true, maxChannels: 5 }), isActive: true, order: 4 },
  ];
  for (const plan of plansData) {
    await db.premiumPlan.upsert({ where: { slug: plan.slug }, update: {}, create: plan });
  }
  console.log('Plans created');

  const userCount = await db.user.count();
  if (userCount === 0) {
    await db.user.create({ data: { email: 'admin@tgdir.com', password: DEMO_PASSWORD_HASH, name: 'Admin', username: 'admin', role: 'SUPER_ADMIN', isEmailVerified: true, isActive: true } });
    console.log('Admin user created');
  }

  const existingSettings = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (!existingSettings) {
    await db.siteSettings.create({
      data: {
        id: 1, siteName: 'Telegram Directory',
        siteDescription: JSON.stringify({ en: 'The most comprehensive Telegram channel and group directory', tr: 'En kapsamlı Telegram kanal ve grup dizini' }),
        defaultLanguage: 'en', supportedLanguages: JSON.stringify(['tr', 'en', 'ru', 'zh', 'id', 'vi', 'es', 'ar', 'de', 'fr']),
        socialLinks: JSON.stringify({ telegram: 'https://t.me/tgdir', twitter: 'https://twitter.com/tgdir' }),
        footerText: JSON.stringify({ en: '© 2026 Telegram Directory', tr: '© 2026 Telegram Dizini' }),
      },
    });
    console.log('Site settings created');
  }

  console.log('Structural seed complete! No demo channels were added.');
  console.log('Use the admin panel or Telegram API to add real channels.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
