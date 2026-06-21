export interface Post {
  id: number;
  slug: string;
  fa: string;
  en: string;
  excerptFa: string;
  excerptEn: string;
  bodyFa: string;
  bodyEn: string;
  catFa: string;
  catEn: string;
  tags: string[];
  author: string;
  date: string;
  hue: number;
  cover?: string;
  relatedProducts?: number[];
}

export const POSTS: Post[] = [
  {
    id: 1,
    slug: "how-to-choose-headphones",
    fa: "راهنمای کامل انتخاب هدفون نویزکنسلینگ",
    en: "The Complete Guide to Choosing Noise-Cancelling Headphones",
    excerptFa:
      "از حذف نویز فعال تا عمر باتری و کیفیت صدا؛ هر آنچه باید پیش از خرید هدفون بدانید.",
    excerptEn:
      "From active noise cancellation to battery life and sound quality — everything to know before buying headphones.",
    bodyFa:
      "هدفون‌های نویزکنسلینگ در سال‌های اخیر به یکی از پرطرفدارترین گجت‌های روزمره تبدیل شده‌اند. اما تنوع بالای مدل‌ها انتخاب را دشوار می‌کند؛ در این راهنما گام‌به‌گام بررسی می‌کنیم که هنگام خرید به چه نکاتی توجه کنید.\n\nمهم‌ترین فاکتور، کیفیت حذف نویز فعال (ANC) است. هدفون‌های خوب با میکروفون‌های داخلی صدای محیط را اندازه می‌گیرند و موج معکوس تولید می‌کنند تا نویز را خنثی کنند. هرچه تعداد میکروفون‌ها و توان پردازش بیشتر باشد، تجربه‌ی سکوت عمیق‌تری خواهید داشت.\n\nعامل دوم، کیفیت صدا و پشتیبانی از کدک‌های پیشرفته مانند LDAC و aptX است. اگر موسیقی با کیفیت بالا گوش می‌دهید، حتماً به این کدک‌ها توجه کنید. عمر باتری نیز اهمیت دارد؛ مدل‌های امروزی معمولاً بین ۲۴ تا ۴۰ ساعت پخش مداوم ارائه می‌دهند.\n\nدر نهایت، راحتی و وزن هدفون را دست‌کم نگیرید. هدفونی که ساعت‌ها روی سرتان خواهد بود باید فشار کمی به گوش و سر وارد کند. پیشنهاد ما این است که پیش از خرید، بازه قیمتی و کاربری اصلی خود را مشخص کنید تا انتخاب ساده‌تر شود.",
    bodyEn:
      "Noise-cancelling headphones have become one of the most popular everyday gadgets in recent years. But the sheer variety of models makes the choice difficult; in this guide we walk through, step by step, what to look for when buying.\n\nThe most important factor is the quality of active noise cancellation (ANC). Good headphones use built-in microphones to measure ambient sound and generate an inverse wave to cancel the noise. The more microphones and the more processing power, the deeper the silence you experience.\n\nThe second factor is sound quality and support for advanced codecs such as LDAC and aptX. If you listen to high-resolution music, pay close attention to these codecs. Battery life also matters; modern models typically offer between 24 and 40 hours of continuous playback.\n\nFinally, do not underestimate comfort and weight. A headphone you will wear for hours should put little pressure on your ears and head. Our advice is to define your budget and primary use case before buying, so the decision becomes much simpler.",
    catFa: "راهنمای خرید",
    catEn: "Buying Guide",
    tags: ["tech", "audio"],
    author: "Sara Ahmadi",
    date: "2026-05-12",
    hue: 215,
  },
  {
    id: 2,
    slug: "smartwatch-vs-fitness-band",
    fa: "ساعت هوشمند یا دستبند سلامتی؟ کدام مناسب شماست",
    en: "Smartwatch vs. Fitness Band: Which One Is Right for You",
    excerptFa:
      "مقایسه‌ای کاربردی میان ساعت‌های هوشمند و دستبندهای سلامتی برای انتخاب آگاهانه‌تر.",
    excerptEn:
      "A practical comparison between smartwatches and fitness bands to help you choose wisely.",
    bodyFa:
      "بازار پوشیدنی‌ها امروز شلوغ‌تر از همیشه است و بسیاری از کاربران بین ساعت هوشمند و دستبند سلامتی مردد می‌مانند. هر دو دسته نقاط قوت خاص خود را دارند.\n\nساعت‌های هوشمند معمولاً نمایشگر بزرگ‌تر، اپلیکیشن‌های متنوع، پاسخ به تماس و پیام و حتی پرداخت بدون تماس را ارائه می‌دهند. در مقابل، قیمت بالاتر و عمر باتری کوتاه‌تری دارند.\n\nدستبندهای سلامتی سبک‌تر و ارزان‌تر هستند و روی پایش فعالیت بدنی، ضربان قلب و خواب تمرکز دارند. اگر هدف اصلی شما ورزش و سلامتی است، دستبند انتخاب منطقی‌تری خواهد بود.\n\nجمع‌بندی ساده است: اگر به یک دستیار همه‌کاره روی مچ نیاز دارید سراغ ساعت هوشمند بروید؛ اگر تمرکز شما بر تناسب اندام با بودجه‌ی محدود است، دستبند سلامتی گزینه‌ی بهتری است.",
    bodyEn:
      "The wearables market is busier than ever, and many users hesitate between a smartwatch and a fitness band. Both categories have their own strengths.\n\nSmartwatches usually offer a larger display, a wide range of apps, call and message handling, and even contactless payments. On the other hand, they come with a higher price and shorter battery life.\n\nFitness bands are lighter and cheaper, focusing on tracking physical activity, heart rate, and sleep. If your main goal is exercise and health, a band is the more sensible choice.\n\nThe takeaway is simple: if you need an all-purpose assistant on your wrist, go for a smartwatch; if your focus is fitness on a limited budget, a fitness band is the better option.",
    catFa: "مقایسه",
    catEn: "Comparison",
    tags: ["tech", "wearable"],
    author: "Mehdi Rahimi",
    date: "2026-05-03",
    hue: 205,
  },
  {
    id: 3,
    slug: "home-espresso-tips",
    fa: "هنر دم‌آوری اسپرسو در خانه",
    en: "The Art of Brewing Espresso at Home",
    excerptFa:
      "با چند نکته‌ی ساده، کیفیت قهوه‌ی خانگی خود را به سطح کافی‌شاپ‌ها برسانید.",
    excerptEn:
      "With a few simple tips, bring your home coffee up to coffee-shop quality.",
    bodyFa:
      "تهیه‌ی یک اسپرسوی عالی در خانه ترکیبی از علم و تمرین است. خبر خوب این است که با رعایت چند اصل پایه، نتیجه‌ای حرفه‌ای به دست خواهید آورد.\n\nاولین گام، تازگی دانه‌ی قهوه است. دانه را درست پیش از دم‌آوری آسیاب کنید و از آسیاب با تنظیم اندازه استفاده کنید. اندازه‌ی آسیاب مستقیماً روی سرعت عبور آب و طعم نهایی اثر می‌گذارد.\n\nدومین نکته، دما و فشار است. دمای آب ایده‌آل حدود ۹۲ تا ۹۶ درجه سانتی‌گراد است و دستگاه باید فشار پایداری در حدود ۹ بار تولید کند. تمپ کردن یکنواخت پودر قهوه نیز برای استخراج یکدست ضروری است.\n\nدر پایان، آزمایش کنید و یادداشت بردارید. کوچک‌ترین تغییر در اندازه‌ی آسیاب یا مقدار قهوه می‌تواند طعم را دگرگون کند. با کمی صبر، فنجان دلخواه خود را پیدا خواهید کرد.",
    bodyEn:
      "Making a great espresso at home is a mix of science and practice. The good news is that by following a few basic principles, you can achieve professional results.\n\nThe first step is bean freshness. Grind the beans right before brewing and use a grinder with adjustable size. The grind size directly affects how fast the water flows and the final taste.\n\nThe second point is temperature and pressure. The ideal water temperature is around 92 to 96 degrees Celsius, and the machine should deliver a stable pressure of about 9 bar. Even tamping of the coffee puck is also essential for uniform extraction.\n\nFinally, experiment and take notes. The smallest change in grind size or dose can transform the flavor. With a little patience, you will find your perfect cup.",
    catFa: "سبک زندگی",
    catEn: "Lifestyle",
    tags: ["home", "coffee"],
    author: "Niloofar Karimi",
    date: "2026-04-22",
    hue: 150,
  },
  {
    id: 4,
    slug: "skincare-routine-basics",
    fa: "اصول یک روتین مراقبت از پوست",
    en: "The Basics of a Solid Skincare Routine",
    excerptFa:
      "ساختن روتین مؤثر پوستی پیچیده نیست؛ با چند محصول درست شروع کنید.",
    excerptEn:
      "Building an effective skincare routine is not complicated — start with a few right products.",
    bodyFa:
      "روتین مراقبت از پوست لازم نیست شامل ده‌ها محصول باشد. در واقع، یک روتین ساده و پایدار اغلب بهتر از یک برنامه‌ی پیچیده عمل می‌کند.\n\nپایه‌ی هر روتین، شست‌وشوی ملایم پوست است. از یک شوینده‌ی مناسب نوع پوست خود استفاده کنید و از آب بسیار داغ بپرهیزید. سپس آبرسانی با یک مرطوب‌کننده‌ی سبک، رطوبت پوست را حفظ می‌کند.\n\nسرم ویتامین C در روز به روشن‌تر شدن و یکدست شدن رنگ پوست کمک می‌کند و آنتی‌اکسیدان‌ها از پوست در برابر آلودگی محافظت می‌کنند. مهم‌ترین گام روزانه اما، ضدآفتاب است که از پیری زودرس جلوگیری می‌کند.\n\nصبور باشید؛ نتایج مراقبت از پوست معمولاً پس از چند هفته نمایان می‌شوند. ثبات، کلید اصلی موفقیت در هر روتین پوستی است.",
    bodyEn:
      "A skincare routine does not need dozens of products. In fact, a simple and consistent routine often works better than a complex regimen.\n\nThe foundation of any routine is gentle cleansing. Use a cleanser suited to your skin type and avoid very hot water. Then hydrating with a lightweight moisturizer keeps your skin's moisture locked in.\n\nA vitamin C serum in the morning helps brighten and even out skin tone, while antioxidants protect the skin against pollution. The single most important daily step, however, is sunscreen, which prevents premature aging.\n\nBe patient; skincare results usually appear after a few weeks. Consistency is the key to success in any skincare routine.",
    catFa: "زیبایی",
    catEn: "Beauty",
    tags: ["beauty", "skincare"],
    author: "Sara Ahmadi",
    date: "2026-04-10",
    hue: 320,
  },
  {
    id: 5,
    slug: "home-workout-essentials",
    fa: "تجهیزات ضروری برای تمرین در خانه",
    en: "Essential Gear for Working Out at Home",
    excerptFa:
      "با چند وسیله‌ی کم‌جا و مقرون‌به‌صرفه، یک باشگاه کوچک در خانه بسازید.",
    excerptEn:
      "Build a small home gym with a few affordable, space-saving items.",
    bodyFa:
      "تمرین در خانه دیگر یک گزینه‌ی دست‌دوم نیست؛ با تجهیزات درست می‌توانید بدون رفتن به باشگاه به اهداف تناسب اندام خود برسید.\n\nنقطه‌ی شروع، یک مت یوگای باکیفیت و ضدلغزش است که پایه‌ی بسیاری از حرکات کششی و قدرتی محسوب می‌شود. دمبل‌های قابل تنظیم نیز فضای کمی اشغال می‌کنند و امکان افزایش تدریجی وزنه را فراهم می‌کنند.\n\nکش‌های مقاومتی ابزاری ارزان و چندکاره‌اند که برای تقویت عضلات و گرم کردن عالی عمل می‌کنند. یک بطری آب هوشمند هم به شما کمک می‌کند در طول تمرین آب کافی بنوشید.\n\nمهم‌تر از تجهیزات، نظم و برنامه است. حتی با حداقل امکانات، اگر برنامه‌ی منظمی داشته باشید نتایج چشمگیری خواهید گرفت.",
    bodyEn:
      "Working out at home is no longer a second-rate option; with the right gear you can reach your fitness goals without going to the gym.\n\nThe starting point is a high-quality, non-slip yoga mat, which forms the base of many stretching and strength movements. Adjustable dumbbells also take little space and let you increase the weight gradually.\n\nResistance bands are a cheap and versatile tool, great for strengthening muscles and warming up. A smart water bottle helps you stay hydrated throughout your workout.\n\nMore important than the equipment is discipline and a plan. Even with minimal gear, a consistent routine will deliver remarkable results.",
    catFa: "ورزش",
    catEn: "Sport",
    tags: ["sport", "fitness"],
    author: "Mehdi Rahimi",
    date: "2026-03-28",
    hue: 28,
  },
  {
    id: 6,
    slug: "ai-shopping-future",
    fa: "آینده‌ی خرید با هوش مصنوعی",
    en: "The Future of Shopping with Artificial Intelligence",
    excerptFa:
      "چگونه دستیارهای هوشمند تجربه‌ی خرید آنلاین را شخصی‌سازی و ساده‌تر می‌کنند.",
    excerptEn:
      "How smart assistants are personalizing and simplifying the online shopping experience.",
    bodyFa:
      "هوش مصنوعی به سرعت در حال تغییر شیوه‌ی خرید آنلاین ماست. از پیشنهادهای شخصی‌سازی‌شده تا جستجوی زبان طبیعی، تجربه‌ی کاربری به سطح تازه‌ای رسیده است.\n\nدستیارهای هوشمند می‌توانند نیاز، بودجه و سلیقه‌ی شما را درک کنند و در میان هزاران محصول، بهترین گزینه را پیشنهاد دهند. این یعنی صرف زمان کمتر برای جستجو و انتخاب آگاهانه‌تر.\n\nعلاوه بر این، هوش مصنوعی به فروشگاه‌ها کمک می‌کند موجودی را بهتر مدیریت کنند، قیمت‌گذاری هوشمند داشته باشند و پشتیبانی شبانه‌روزی ارائه دهند. خلاصه‌سازی خودکار مقالات و نقد محصولات نیز به کاربران کمک می‌کند سریع‌تر تصمیم بگیرند.\n\nآینده‌ای را تصور کنید که در آن کافی است بگویید چه می‌خواهید و سیستم بقیه‌ی کار را انجام دهد. این آینده دیگر دور نیست؛ همین حالا در حال شکل‌گیری است.",
    bodyEn:
      "Artificial intelligence is rapidly changing the way we shop online. From personalized recommendations to natural language search, the user experience has reached a new level.\n\nSmart assistants can understand your needs, budget, and taste, and suggest the best option among thousands of products. That means less time spent searching and more informed choices.\n\nIn addition, AI helps stores manage inventory better, set smart pricing, and offer around-the-clock support. Automatic summarization of articles and product reviews also helps users decide faster.\n\nImagine a future where you simply say what you want and the system does the rest. That future is no longer far away; it is taking shape right now.",
    catFa: "فناوری",
    catEn: "Technology",
    tags: ["tech", "ai"],
    author: "Niloofar Karimi",
    date: "2026-03-15",
    hue: 262,
  },
];

export const postBySlug = (s: string) => POSTS.find((p) => p.slug === s);
