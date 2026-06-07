/** Server-side catalog labels (mirrors frontend catalogI18n.js) */

const CATEGORY_HI = {
  "All Vegetables": "सभी उत्पाद",
  "All Products": "सभी उत्पाद",
  Vegetables: "सब्ज़ियाँ",
  Fruits: "फल",
  Grains: "अनाज",
  Dairy: "डेयरी",
  "Root Vegetables": "जड़ वाली सब्ज़ियाँ",
  "Leafy Greens": "पत्तेदार सब्ज़ियाँ",
  "Green Vegetables": "हरी सब्ज़ियाँ",
  "Seasonal Vegetables": "मौसमी उत्पाद",
  "Seasonal Products": "मौसमी उत्पाद",
};

const CATEGORY_PA = {
  "All Vegetables": "ਸਾਰੇ ਉਤਪਾਦ",
  "All Products": "ਸਾਰੇ ਉਤਪਾਦ",
  Vegetables: "ਸਬਜ਼ੀਆਂ",
  Fruits: "ਫਲ",
  Grains: "ਅਨਾਜ",
  Dairy: "ਡੇਰੀ",
  "Root Vegetables": "ਜੜ੍ਹ ਵਾਲੀਆਂ ਸਬਜ਼ੀਆਂ",
  "Leafy Greens": "ਪੱਤੇਦਾਰ ਸਬਜ਼ੀਆਂ",
  "Green Vegetables": "ਹਰੀਆਂ ਸਬਜ਼ੀਆਂ",
  "Seasonal Vegetables": "ਮੌਸਮੀ ਉਤਪਾਦ",
  "Seasonal Products": "ਮੌਸਮੀ ਉਤਪਾਦ",
};

const PRODUCE_HI = {
  papaya: "पपीता",
  "lady finger": "भिंडी",
  okra: "भिंडी",
  pea: "मटर",
  peas: "मटर",
  broccoli: "ब्रोकली",
  cabbage: "पत्तागोभी",
  mango: "आम",
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
};

function normKey(value) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function localizeCategory(category, lang) {
  if (!lang || lang === "en" || !category) return category;
  const map = lang === "hi" ? CATEGORY_HI : lang === "pa" ? CATEGORY_PA : null;
  return map?.[category] || category;
}

function localizeName(name, lang) {
  if (!lang || lang === "en" || !name) return name;
  const bundle = lang === "hi" ? PRODUCE_HI : lang === "pa" ? PRODUCE_PA : null;
  if (!bundle) return name;
  return bundle[normKey(name)] || name;
}

export function localizeProductDoc(product, lang) {
  if (!product || !lang || lang === "en") return product;
  const doc = product.toObject ? product.toObject() : { ...product };
  doc.name = localizeName(doc.name, lang);
  doc.category = localizeCategory(doc.category, lang);
  if (doc.vendor && typeof doc.vendor === "object" && doc.vendor.name) {
    doc.vendor = { ...doc.vendor, name: doc.vendor.name };
  }
  return doc;
}
