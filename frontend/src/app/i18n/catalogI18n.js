import { translations } from "./translations";

/** English DB category value → translation key in translations.js */
export const CATEGORY_KEY_MAP = {
  "All Vegetables": "category_all",
  "All Products": "category_all",
  Vegetables: "category_vegetables",
  Fruits: "category_fruits",
  Grains: "category_grains",
  Dairy: "category_dairy",
  "Root Vegetables": "category_root",
  "Leafy Greens": "category_leafy",
  "Green Vegetables": "category_green",
  "Seasonal Vegetables": "category_seasonal",
  "Seasonal Products": "category_seasonal",
};

export function normKey(value) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Hindi / Punjabi produce names keyed by normalized English name */
const PRODUCE_HI = {
  papaya: "पपीता",
  "lady finger": "भिंडी",
  "okra": "भिंडी",
  pea: "मटर",
  peas: "मटर",
  broccoli: "ब्रोकली",
  cabbage: "पत्तागोभी",
  mango: "आम",
  tomato: "टमाटर",
  "fresh tomatoes": "ताज़े टमाटर",
  potatoes: "आलू",
  potato: "आलू",
  "russet potatoes": "रसेट आलू",
  onion: "प्याज",
  "red onions": "लाल प्याज",
  carrot: "गाजर",
  "organic carrots": "ऑर्गेनिक गाजर",
  spinach: "पालक",
  "baby spinach": "बेबी पालक",
  cucumber: "खीरा",
  "bell pepper": "शिमला मिर्च",
  "bell peppers": "शिमला मिर्च",
  cauliflower: "फूलगोभी",
  brinjal: "बैंगन",
  eggplant: "बैंगन",
  "bottle gourd": "लौकी",
  "bitter gourd": "करेला",
  "ridge gourd": "तोरी",
  pumpkin: "कद्दू",
  watermelon: "तरबूज",
  apple: "सेब",
  banana: "केला",
  orange: "संतरा",
  grapes: "अंगूर",
  pomegranate: "अनार",
  strawberry: "स्ट्रॉबेरी",
  corn: "मक्का",
  "sweet corn": "मीठा मक्का",
  garlic: "लहसुन",
  ginger: "अदरक",
  lemon: "नींबू",
  lime: "नींबू",
  beetroot: "चुकंदर",
  turnip: "शलजम",
  radish: "मूली",
  beans: "बीन्स",
  "green beans": "फ्रेंच बीन्स",
  mushroom: "मशरूम",
  avocado: "एवोकाडो",
  kiwi: "कीवी",
  pineapple: "अनानास",
  coconut: "नारियल",
  coriander: "धनिया",
  mint: "पुदीना",
  "fresh broccoli": "ताज़ा ब्रोकली",
};

const PRODUCE_PA = {
  papaya: "ਪਪੀਤਾ",
  "lady finger": "ਭਿੰਡੀ",
  okra: "ਭਿੰਡੀ",
  pea: "ਮਟਰ",
  peas: "ਮਟਰ",
  broccoli: "ਬ੍ਰੋਕਲੀ",
  cabbage: "ਗੋਭੀ",
  mango: "ਅੰਬ",
  tomato: "ਟਮਾਟਰ",
  "fresh tomatoes": "ਤਾਜ਼ੇ ਟਮਾਟਰ",
  potatoes: "ਆਲੂ",
  potato: "ਆਲੂ",
  "russet potatoes": "ਰਸੇਟ ਆਲੂ",
  onion: "ਪਿਆਜ਼",
  "red onions": "ਲਾਲ ਪਿਆਜ਼",
  carrot: "ਗਾਜਰ",
  "organic carrots": "ਆਰਗੈਨਿਕ ਗਾਜਰ",
  spinach: "ਪਾਲਕ",
  "baby spinach": "ਬੇਬੀ ਪਾਲਕ",
  cucumber: "ਖੀਰਾ",
  "bell pepper": "ਸ਼ਿਮਲਾ ਮਿਰਚ",
  "bell peppers": "ਸ਼ਿਮਲਾ ਮਿਰਚ",
  cauliflower: "ਫੁੱਲ ਗੋਭੀ",
  brinjal: "ਬੈਂਗਣ",
  eggplant: "ਬੈਂਗਣ",
  "bottle gourd": "ਘੀਆ",
  "bitter gourd": "ਕਰੇਲਾ",
  "ridge gourd": "ਤੋਰੀ",
  pumpkin: "ਕੱਦੂ",
  watermelon: "ਤਰਬੂਜ",
  apple: "ਸੇਬ",
  banana: "ਕੇਲਾ",
  orange: "ਸੰਤਰਾ",
  grapes: "ਅੰਗੂਰ",
  pomegranate: "ਅਨਾਰ",
  strawberry: "ਸਟ੍ਰਾਬੇਰੀ",
  corn: "ਮੱਕੀ",
  "sweet corn": "ਮਿੱਠੀ ਮੱਕੀ",
  garlic: "ਲਸਣ",
  ginger: "ਅਦਰਕ",
  lemon: "ਨੀਂਬੂ",
  lime: "ਨੀਂਬੂ",
  beetroot: "ਚੁਕੰਦਰ",
  turnip: "ਸ਼ਲਜਮ",
  radish: "ਮੂਲੀ",
  beans: "ਬੀਨਜ਼",
  "green beans": "ਫ੍ਰੈਂਚ ਬੀਨਜ਼",
  mushroom: "ਮਸ਼ਰੂਮ",
  avocado: "ਐਵੋਕਾਡੋ",
  kiwi: "ਕੀਵੀ",
  pineapple: "ਅਨਾਨਾਸ",
  coconut: "ਨਾਰੀਅਲ",
  coriander: "ਧਨੀਆ",
  mint: "ਪੁਦੀਨਾ",
  "fresh broccoli": "ਤਾਜ਼ੀ ਬ੍ਰੋਕਲੀ",
};

const PRODUCE_BY_LANG = { hi: PRODUCE_HI, pa: PRODUCE_PA };

const VENDOR_NAMES_HI = {
  "Fresh Farms": "ताज़ा फार्म",
  "Green Valley": "ग्रीन वैली",
  "Sunny Produce": "सनी प्रोड्यूस",
  "Farm Direct": "फार्म डायरेक्ट",
};

const VENDOR_NAMES_PA = {
  "Fresh Farms": "ਤਾਜ਼ਾ ਫਾਰਮ",
  "Green Valley": "ਗ੍ਰੀਨ ਵੈਲੀ",
  "Sunny Produce": "ਸਨੀ ਪ੍ਰੋਡਿਊਸ",
  "Farm Direct": "ਫਾਰਮ ਡਾਇਰੈਕਟ",
};

export function localizeCategoryLabel(category, lang) {
  if (!category) return category;
  if (!lang || lang === "en") return category;
  const key = CATEGORY_KEY_MAP[category];
  if (key) {
    return translations[lang]?.[key] ?? translations.en[key] ?? category;
  }
  return category;
}

export function localizeProductName(name, lang) {
  if (!name || !lang || lang === "en") return name;
  const bundle = PRODUCE_BY_LANG[lang];
  if (!bundle) return name;
  const key = normKey(name);
  return bundle[key] || name;
}

export function localizeVendorName(vendorName, lang) {
  if (!vendorName || !lang || lang === "en") return vendorName;
  const map = lang === "hi" ? VENDOR_NAMES_HI : lang === "pa" ? VENDOR_NAMES_PA : null;
  if (!map) return vendorName;
  return map[vendorName] || vendorName;
}

export function localizeProduct(product, lang) {
  if (!product) return product;

  const vendorObj = typeof product.vendor === "object" && product.vendor ? product.vendor : null;
  const vendorName =
    vendorObj?.storeName || vendorObj?.name || (typeof product.vendor === "string" ? product.vendor : "");

  const name = localizeProductName(product.name, lang);
  const category = localizeCategoryLabel(product.category, lang);
  const vendor = localizeVendorName(vendorName, lang);

  return {
    ...product,
    name,
    category,
    vendor,
    vendorName,
  };
}
