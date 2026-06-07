import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/auth';
import { OrdersProvider } from '../context/OrdersContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toaster } from '../components/ui/sonner';
import { Footer } from '../components/Footer';
import { OffersFloatingBadge } from '../components/OffersFloatingBadge';
import { VendorNotification } from '../components/VendorNotification';
import { UserNotification } from '../components/UserNotification';
import { ReviewPromptProvider } from '../context/ReviewPromptContext';

function RootContent() {
  const { user } = useAuth();
  const location = useLocation();
  const isVendor = user?.role === 'vendor';
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 overflow-x-hidden max-w-[100vw] transition-colors duration-300">
        <Outlet />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col overflow-x-hidden max-w-[100vw]">
      {!isVendor && <OffersFloatingBadge />}
      <Header />
      <VendorNotification />
      <UserNotification />
      <main className="flex-grow min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export function Root() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OrdersProvider>
            <ReviewPromptProvider>
              <CartProvider>
                <RootContent />
              </CartProvider>
            </ReviewPromptProvider>
          </OrdersProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
