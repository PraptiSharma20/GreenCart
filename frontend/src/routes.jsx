import { createBrowserRouter } from "react-router-dom";
import { Root } from "./app/pages/Root";
import { Home } from "./app/pages/Home";
import { ProductDetail } from "./app/pages/ProductDetails";
import { Cart } from "./app/pages/Cart";
import { Checkout } from "./app/pages/Checkout";
import { Orders } from "./app/pages/Orders";
import { Login } from "./app/pages/Login";
import { Register } from "./app/pages/Register";
import { VendorDashboard } from "./app/pages/VendorDashboard";
import { VendorNotifications } from "./app/pages/VendorNotifications";
import { AdminDashboard } from "./app/pages/AdminDashboard";
import { Offers } from "./app/pages/Offers";
import { About } from "./app/pages/About";
import { Contact } from "./app/pages/Contact";
import { Terms } from "./app/pages/Terms";
import { Careers } from "./app/pages/Careers";
import { Privacy } from "./app/pages/Privacy";
import { Wishlist } from "./app/pages/Wishlist";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "product/:id", Component: ProductDetail },
      { path: "cart", Component: Cart },
      { path: "wishlist", Component: Wishlist },
      { path: "checkout", Component: Checkout },
      { path: "orders", Component: Orders },
      { path: "offers", Component: Offers },
      { path: "about", Component: About },
      { path: "contact", Component: Contact },
      { path: "terms", Component: Terms },
      { path: "careers", Component: Careers },
      { path: "privacy", Component: Privacy },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "vendor/dashboard", Component: VendorDashboard },
      { path: "vendor/notifications", Component: VendorNotifications },
      { path: "admin/dashboard", Component: AdminDashboard },
    ],
  },
]);
