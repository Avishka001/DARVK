import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroVideo from './components/HeroVideo';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import BrandStory from './components/BrandStory';
import AdminDashboard from './components/AdminDashboard';
import { CartItem, Category, Product, OrderDetails } from './types';
import { Instagram, Youtube, HelpCircle, ShieldCheck, CreditCard, Sparkles, Check, ArrowUpRight } from 'lucide-react';
import { DarvkLogo } from './components/DarvkLogo';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { useUser } from './context/UserContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { UserProvider } from './context/UserContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import * as api from './api';

import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import InvoicePage from './pages/InvoicePage';

function AppContent() {
  const { allProducts } = useAdmin();
  const { isAdmin } = useUser();
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isUserAuthOpen, setIsUserAuthOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('aura_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');

  // Handle invoice routing
  if (window.location.pathname.startsWith('/invoice/')) {
    const orderId = window.location.pathname.replace('/invoice/', '');
    return <InvoicePage orderId={orderId} />;
  }

  // Email dispatch newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success'>('idle');

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(cart));
  }, [cart]);

  // Listen to event from CheckoutModal auth step
  useEffect(() => {
    const handler = (e: Event) => {
      setIsUserAuthOpen(true);
    };
    window.addEventListener('openUserAuth', handler);
    return () => window.removeEventListener('openUserAuth', handler);
  }, []);

  const handleAddToCart = (
    product: Product,
    size: string,
    color: { name: string; hex: string },
    quantity: number
  ) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor.name === color.name
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }

      return [...prev, { product, selectedSize: size, selectedColor: color, quantity }];
    });
  };

  const handleQuickAdd = (
    product: Product,
    size: string,
    color: { name: string; hex: string }
  ) => {
    handleAddToCart(product, size, color, 1);
    setIsCartOpen(true); // Instant delightful UX transition
  };

  const handleUpdateCartQuantity = (idx: number, newQty: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLaunchCheckout = (discountCode: string) => {
    setAppliedDiscountCode(discountCode);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (orderDetails: OrderDetails) => {
    console.log('Order verified successfully:', orderDetails);
  };

  const handleClearCart = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setAppliedDiscountCode('');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      api.subscribeNewsletter(newsletterEmail.trim()).catch((err) => {
        console.error('Newsletter subscription failed:', err);
      });
      setNewsletterStatus('success');
      setTimeout(() => {
        setNewsletterEmail('');
        setNewsletterStatus('idle');
      }, 3000);
    }
  };

  const scrollToGrid = () => {
    const gridSection = document.getElementById('collection-grid-section');
    if (gridSection) {
      gridSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter products based on search input query
  const searchedProducts = allProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-600 selection:text-white">
      {/* Sleek Translucent Navbar */}
      <Navbar
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery(''); // Clear search on category navigation
          // Smooth scroll to catalog
          setTimeout(() => {
            const el = document.getElementById('collection-grid-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onSearch={setSearchQuery}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenUserAuth={() => setIsUserAuthOpen(true)}
        onOpenUserProfile={() => setIsUserProfileOpen(true)}
      />

      <AuthModal
        isOpen={isUserAuthOpen}
        onClose={() => setIsUserAuthOpen(false)}
        onLoginSuccess={() => {
          setIsUserAuthOpen(false);
        }}
      />
      <UserProfileModal isOpen={isUserProfileOpen} onClose={() => setIsUserProfileOpen(false)} />

      {/* Cinematic loop Background Hero Video */}
      <HeroVideo onExploreClick={scrollToGrid} />

      {/* Main Core Store Catalog Grid */}
      <ProductGrid
        products={searchedProducts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onProductClick={setActiveProduct}
        onQuickAdd={handleQuickAdd}
      />

      {/* Fabric Engineering bento grid details */}
      <BrandStory />

      {/* Detailed Product spec view Drawer / Modal */}
      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Dynamic Sliding Shopping Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleLaunchCheckout}
      />

      {/* Full screen Stripe-style secure Checkout gateway */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        discountCode={appliedDiscountCode}
        onSuccess={handlePaymentSuccess}
        onClearCart={handleClearCart}
      />
      {isAdminDashboardOpen && isAdmin && (
        <AdminDashboard
          onClose={() => setIsAdminDashboardOpen(false)}
        />
      )}

      {/* Clean Premium Page footer */}
      <footer id="app-footer-grid" className="bg-[#0c0c0c] border-t border-white/5 py-16 text-white font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <DarvkLogo />
              <p className="text-xs text-zinc-400 leading-relaxed tracking-wider">
                We craft ultra-premium athletic apparel engineered to preserve shape, withstand high-volume training, and deliver an outstanding visual silhouette.
              </p>
              <div className="flex space-x-3.5 pt-2">
                <a href="#" className="p-2.5 bg-[#050505] hover:bg-white hover:text-black border border-white/5 rounded-sm transition-all text-white">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="p-2.5 bg-[#050505] hover:bg-white hover:text-black border border-white/5 rounded-sm transition-all text-white">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Navigation link shortcuts */}
            <div>
              <h4 className="text-xs font-bold tracking-[0.25em] text-neutral-300 uppercase mb-4">
                COLLECTIONS
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-semibold tracking-wider uppercase">
                <li>
                  <button onClick={() => { setSelectedCategory('tops'); scrollToGrid(); }} className="hover:text-red-500 transition-colors">
                    Tops & Seamless Tees
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedCategory('bottoms'); scrollToGrid(); }} className="hover:text-red-500 transition-colors">
                    Utility Joggers & Leggings
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedCategory('outerwear'); scrollToGrid(); }} className="hover:text-red-500 transition-colors">
                    Organic Heavy Hoodies
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedCategory('accessories'); scrollToGrid(); }} className="hover:text-red-500 transition-colors">
                    Ballistic Training Bags
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Support links */}
            <div>
              <h4 className="text-xs font-bold tracking-[0.25em] text-neutral-300 uppercase mb-4">
                SUPPORT DESK
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-semibold tracking-wider uppercase">
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Returns Policy: COMPLIMENTARY 30-day sizing defense. Sizing exchanges are completely free.'); }} className="hover:text-red-500 transition-colors">
                    Returns & Size Exchanges
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Shipping Hubs: Dispatch starts within 24h. Tracking code is sent via email dispatch.'); }} className="hover:text-red-500 transition-colors">
                    Global Shipping Hubs
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('For priority customer support: contact us at priority@darvk.com'); }} className="hover:text-red-500 transition-colors">
                    Sponsorship Matrix
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('PCI-DSS certificate verified. All credit transactions use tokenized end-to-end hashes.'); }} className="hover:text-red-500 transition-colors">
                    Secure Encryption
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter dispatch registration */}
            <div>
              <h4 className="text-xs font-black tracking-[0.25em] text-zinc-300 uppercase mb-4 font-mono">
                // BLACKOUT DISPATCHES
              </h4>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed tracking-wider">
                Unlock 10% off your initial shipment and secure VIP early reservation to seasonal blackouts.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                <div className="relative">
                  <input
                    id="newsletter-email-input"
                    type="email"
                    placeholder="ENTER YOUR EMAIL"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-[#050505] border border-white/5 focus:border-white focus:outline-none px-4 py-3 text-[10px] rounded-sm text-white font-mono placeholder-white/20 tracking-widest uppercase"
                  />
                  <button
                    id="newsletter-submit-btn"
                    type="submit"
                    className="absolute right-2 top-1.5 bg-red-600 hover:bg-red-700 text-white p-2 rounded-sm transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {newsletterStatus === 'success' && (
                  <span className="text-[9px] text-emerald-400 font-bold block tracking-widest uppercase flex items-center space-x-1 font-mono">
                    <Check className="w-3 h-3" />
                    <span>SUBSCRIBED! PROMO DISPATCHED.</span>
                  </span>
                )}
              </form>
            </div>
          </div>

          {/* Copyrights and Credentials footer board */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
            <div>
              © 2026 AURA PREMIUM INC. ALL INTELLECTUAL PROPERTY PROTECTED.
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>PCI-DSS ENVELOPE</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                <span>VISA / MASTERCARD / AMEX</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <UserProvider>
          <AdminProvider>
            <CurrencyProvider>
              <AppContent />
            </CurrencyProvider>
          </AdminProvider>
        </UserProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

