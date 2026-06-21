import type { Product } from "@/lib/types";

export const PRODUCTS: Product[] = [
  { id: 1, fa: "هدفون بی‌سیم نویزکنسلینگ پرو", en: "Pro Wireless Noise-Cancelling Headphones", cat: "tech", brand: "TechPro", price: 4200000, old: 5600000, rating: 4.8, reviews: 1240, hue: 215, badge: ["فروش ویژه", "Hot Deal"], colors: [["مشکی", "#1a1a1a"], ["نقره‌ای", "#c8ccd1"], ["آبی", "#2a6fdb"]], country: "کره جنوبی", warranty: "۱۸ ماه", stock: 34 },
  { id: 2, fa: "ساعت هوشمند سری ۷", en: "Smartwatch Series 7", cat: "tech", brand: "Zenith", price: 8900000, rating: 4.6, reviews: 860, hue: 205, colors: [["مشکی", "#1a1a1a"], ["طلایی", "#d4af37"]], country: "چین", warranty: "۱۲ ماه", stock: 18 },
  { id: 3, fa: "اسپیکر بلوتوثی قابل حمل", en: "Portable Bluetooth Speaker", cat: "tech", brand: "Maxon", price: 2150000, rating: 4.5, reviews: 540, hue: 228, colors: [["مشکی", "#1a1a1a"], ["قرمز", "#e11d48"]], country: "چین", warranty: "۱۲ ماه", stock: 52 },
  { id: 4, fa: "پاوربانک ۲۰۰۰۰ میلی‌آمپر", en: "Power Bank 20000mAh", cat: "tech", brand: "Aria", price: 980000, rating: 4.4, reviews: 980, hue: 238, country: "چین", warranty: "۶ ماه", stock: 120 },
  { id: 5, fa: "کیبورد مکانیکی گیمینگ", en: "Mechanical Gaming Keyboard", cat: "tech", brand: "Borna", price: 3300000, old: 3900000, rating: 4.7, reviews: 420, hue: 198, badge: ["جدید", "New"], colors: [["مشکی", "#1a1a1a"], ["سفید", "#f1f3f6"]], country: "تایوان", warranty: "۱۲ ماه", stock: 27 },
  { id: 6, fa: "کفش کتانی روزمره", en: "Everyday Casual Sneakers", cat: "fashion", brand: "Parsan", price: 1850000, old: 2400000, rating: 4.6, reviews: 720, hue: 345, colors: [["سفید", "#f1f3f6"], ["مشکی", "#1a1a1a"], ["سرمه‌ای", "#1e293b"]], sizes: ["۴۰", "۴۱", "۴۲", "۴۳", "۴۴"], country: "ویتنام", warranty: "-", stock: 60 },
  { id: 7, fa: "کوله‌پشتی شهری ضدآب", en: "Waterproof Urban Backpack", cat: "fashion", brand: "Kasra", price: 1450000, rating: 4.7, reviews: 610, hue: 352, colors: [["مشکی", "#1a1a1a"], ["خاکی", "#5b6b4a"]], country: "چین", warranty: "۶ ماه", stock: 44 },
  { id: 8, fa: "عینک آفتابی پولاریزه", en: "Polarized Sunglasses", cat: "fashion", brand: "Elina", price: 890000, rating: 4.3, reviews: 300, hue: 18, country: "ایتالیا", warranty: "-", stock: 80 },
  { id: 9, fa: "ساعت مچی کلاسیک چرمی", en: "Classic Leather Wristwatch", cat: "fashion", brand: "Zenith", price: 3600000, rating: 4.8, reviews: 410, hue: 32, badge: ["پرفروش", "Bestseller"], country: "سوئیس", warranty: "۲۴ ماه", stock: 22 },
  { id: 10, fa: "قهوه‌ساز اسپرسو نیمه‌اتومات", en: "Semi-Auto Espresso Machine", cat: "home", brand: "Diako", price: 12500000, old: 14900000, rating: 4.7, reviews: 520, hue: 150, badge: ["فروش ویژه", "Hot Deal"], country: "ایتالیا", warranty: "۲۴ ماه", stock: 12 },
  { id: 11, fa: "جاروبرقی شارژی بدون سیم", en: "Cordless Stick Vacuum", cat: "home", brand: "Novین", price: 9800000, rating: 4.5, reviews: 380, hue: 162, country: "آلمان", warranty: "۱۸ ماه", stock: 16 },
  { id: 12, fa: "ست ظروف سرامیکی ۲۴ پارچه", en: "24-Piece Ceramic Dinnerware Set", cat: "home", brand: "Parsan", price: 2200000, rating: 4.6, reviews: 240, hue: 42, country: "ایران", warranty: "-", stock: 30 },
  { id: 13, fa: "چراغ رومیزی مدرن LED", en: "Modern LED Desk Lamp", cat: "home", brand: "Aria", price: 760000, rating: 4.4, reviews: 190, hue: 52, colors: [["سفید", "#f1f3f6"], ["مشکی", "#1a1a1a"]], country: "چین", warranty: "۱۲ ماه", stock: 70 },
  { id: 14, fa: "سرم ویتامین C روشن‌کننده", en: "Brightening Vitamin C Serum", cat: "beauty", brand: "Elina", price: 650000, old: 850000, rating: 4.7, reviews: 1500, hue: 320, badge: ["جدید", "New"], country: "فرانسه", warranty: "-", stock: 200 },
  { id: 15, fa: "سشوار حرفه‌ای یونیزه", en: "Professional Ionic Hair Dryer", cat: "beauty", brand: "Maxon", price: 3100000, rating: 4.6, reviews: 430, hue: 315, country: "آلمان", warranty: "۱۲ ماه", stock: 25 },
  { id: 16, fa: "مت یوگا حرفه‌ای ضدلغزش", en: "Pro Non-Slip Yoga Mat", cat: "sport", brand: "Borna", price: 690000, rating: 4.8, reviews: 670, hue: 28, colors: [["بنفش", "#7c3aed"], ["سبز", "#1f8a5b"], ["آبی", "#2a6fdb"]], country: "چین", warranty: "-", stock: 90 },
  { id: 17, fa: "دمبل قابل تنظیم ۲۴ کیلویی", en: "Adjustable Dumbbell 24kg", cat: "sport", brand: "Kasra", price: 4500000, old: 5200000, rating: 4.5, reviews: 210, hue: 20, badge: ["فروش ویژه", "Hot Deal"], country: "چین", warranty: "۱۲ ماه", stock: 14 },
  { id: 18, fa: "بطری آب ورزشی هوشمند", en: "Smart Sports Water Bottle", cat: "sport", brand: "Aria", price: 320000, rating: 4.4, reviews: 540, hue: 190, colors: [["آبی", "#2a6fdb"], ["مشکی", "#1a1a1a"]], country: "چین", warranty: "-", stock: 150 },
];

export const productById = (id: number) => PRODUCTS.find((p) => p.id === id);
