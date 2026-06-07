export const products = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    category: "Seasonal Vegetables",
    price: 249,
    unit: "per kg",
    image: "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b21hdG9lcyUyMHZlZ2V0YWJsZSUyMGZyZXNofGVufDF8fHx8MTc3MDc0NzYzOXww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Fresh, ripe tomatoes perfect for salads and cooking",
    inStock: true,
    vendor: "Fresh Farms",
    rating: 4.5,
    reviews: 128
  },
  {
    id: "2",
    name: "Organic Carrots",
    category: "Root Vegetables",
    price: 165,
    unit: "per kg",
    image: "https://images.unsplash.com/photo-1654842783533-6d80647c40ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJyb3RzJTIwb3JnYW5pYyUyMHZlZ2V0YWJsZXN8ZW58MXx8fHwxNzcwNzQ3NjM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Sweet and crunchy organic carrots, rich in beta-carotene",
    inStock: true,
    vendor: "Green Valley",
    rating: 4.8,
    reviews: 95
  },
  {
    id: "3",
    name: "Fresh Broccoli",
    category: "Green Vegetables",
    price: 290,
    unit: "per piece",
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9jY29saSUyMGdyZWVuJTIwdmVnZXRhYmxlfGVufDF8fHx8MTc3MDc0NzY0MHww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Nutrient-rich broccoli crowns, perfect for steaming or roasting",
    inStock: true,
    vendor: "Fresh Farms",
    rating: 4.6,
    reviews: 73
  },
  {
    id: "4",
    name: "Bell Peppers",
    category: "Seasonal Vegetables",
    price: 415,
    unit: "per kg",
    image: "https://images.unsplash.com/photo-1757332334667-d2e75d5816ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWxsJTIwcGVwcGVycyUyMGNvbG9yZnVsfGVufDF8fHx8MTc3MDY1MDIxNnww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Colorful bell peppers with sweet and crispy taste",
    inStock: true,
    vendor: "Sunny Produce",
    rating: 4.7,
    reviews: 112
  },
  {
    id: "5",
    name: "Baby Spinach",
    category: "Leafy Greens",
    price: 332,
    unit: "per bag",
    image: "https://images.unsplash.com/photo-1653842648037-2e449847a78d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGluYWNoJTIwbGVhZnklMjBncmVlbnN8ZW58MXx8fHwxNzcwNzQ3NjQwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Fresh, tender baby spinach leaves rich in iron",
    inStock: true,
    vendor: "Green Valley",
    rating: 4.9,
    reviews: 156
  },
  {
    id: "6",
    name: "Russet Potatoes",
    category: "Root Vegetables",
    price: 207,
    unit: "per 5kg bag",
    image: "https://images.unsplash.com/photo-1648722750947-a9614ffd359e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3RhdG9lcyUyMHJvb3QlMjB2ZWdldGFibGVzfGVufDF8fHx8MTc3MDc0NzY0MHww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Perfect for baking, mashing, or frying",
    inStock: true,
    vendor: "Farm Direct",
    rating: 4.4,
    reviews: 89
  },
  {
    id: "7",
    name: "Red Onions",
    category: "Root Vegetables",
    price: 149,
    unit: "per kg",
    image: "https://images.unsplash.com/photo-1628793561336-5e90cb873032?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmlvbnMlMjBmcmVzaCUyMHZlZ2V0YWJsZXN8ZW58MXx8fHwxNzcwNzEyMjM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Mild and sweet red onions for salads and cooking",
    inStock: true,
    vendor: "Fresh Farms",
    rating: 4.3,
    reviews: 64
  },
  {
    id: "8",
    name: "Cucumber",
    category: "Seasonal Vegetables",
    price: 124,
    unit: "each",
    image: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=1080",
    description: "Crisp and refreshing cucumbers",
    inStock: true,
    vendor: "Sunny Produce",
    rating: 4.5,
    reviews: 78
  }
];

/** Internal category id for “show everything” filter (label via category_all → “All Products”) */
export const ALL_PRODUCTS_CATEGORY = "All Products";

export const categories = [
  ALL_PRODUCTS_CATEGORY,
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Root Vegetables",
  "Leafy Greens",
  "Green Vegetables",
  "Seasonal Products",
];

/** Legacy DB / seed values still map to the same labels */
export const LEGACY_CATEGORY_IDS = {
  "All Vegetables": ALL_PRODUCTS_CATEGORY,
  "Seasonal Vegetables": "Seasonal Products",
};






