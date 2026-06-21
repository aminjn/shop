# استقرار روی ابر آروان (ArvanCloud)

پروژه آمادهٔ Docker است (`output: "standalone"` + `Dockerfile`). دو روش:

## روش ۱ — پلتفرم ابری آروان (PaaS) با ایمیج Docker (پیشنهادی)

۱) ساخت ایمیج به‌صورت محلی:

```bash
docker build -t shop:latest .
```

۲) ورود به رجیستری آروان و ارسال ایمیج (نام فضای‌نام خود را جایگزین کنید):

```bash
docker login registry.arvancloud.ir            # با ایمیل/رمز یا توکن آروان
docker tag shop:latest registry.arvancloud.ir/<namespace>/shop:latest
docker push registry.arvancloud.ir/<namespace>/shop:latest
```

۳) در پنل آروان → **پلتفرم ابری** → ساخت اپلیکیشن جدید از روی ایمیج:
- Image: `registry.arvancloud.ir/<namespace>/shop:latest`
- Port (پورت کانتینر): **3000**
- منابع: حداقل ۲۵۶MB رم کافی است (۵۱۲MB راحت‌تر)
- Environment Variables:
  - `NEXT_PUBLIC_SITE_URL=https://your-domain.ir`
  - `ANTHROPIC_API_KEY=...` (اختیاری — برای جستجو/چت واقعی AI؛ بدون آن fallback محلی کار می‌کند)
  - `ANTHROPIC_MODEL=claude-haiku-4-5` (اختیاری)

۴) دامنه را وصل کنید و در صورت تمایل CDN آروان را جلوی اپ فعال کنید.

## روش ۲ — سرور ابری آروان (VM)

```bash
# روی سرور (Ubuntu) پس از نصب Docker:
git clone https://github.com/aminjn/shop.git && cd shop
docker build -t shop:latest .
docker run -d --name shop -p 80:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://your-domain.ir \
  -e ANTHROPIC_API_KEY=...  \
  --restart unless-stopped shop:latest
```

سپس دامنه را به IP سرور اشاره دهید (و در صورت نیاز nginx/SSL یا CDN آروان جلوی آن).

## بدون Docker (تست سریع روی هر هاست Node)

```bash
npm ci && npm run build
node .next/standalone/server.js   # روی PORT=3000
```

## نکات
- پیش‌فرض زبان فارسی و راست‌چین است؛ مسیر `/` به `/fa` هدایت می‌شود.
- متغیر `NEXT_PUBLIC_SITE_URL` برای صحت `sitemap.xml`، `robots.txt` و متادیتای سئو لازم است.
