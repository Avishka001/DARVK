import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, User, ShieldCheck, Moon, Sun, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '../types';
import { DarvkLogo } from './DarvkLogo';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { useCurrency } from '../context/CurrencyContext';
import { useUser } from '../context/UserContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  onSearch: (query: string) => void;
  onOpenAdminDashboard: () => void;
  onOpenUserAuth: () => void;
  onOpenUserProfile: () => void;
}

export default function Navbar({
  cartCount,
  onOpenCart,
  selectedCategory,
  onSelectCategory,
  onSearch,
  onOpenAdminDashboard,
  onOpenUserAuth,
  onOpenUserProfile,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { allCategories } = useAdmin();
  const { currentUser, isUserLoggedIn, isAdmin, logoutUser } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { countries, selectedCountry, setSelectedCountryByCode } = useCurrency();

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.currencyCode.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const categories: { label: string; value: Category }[] = [
    { label: 'ALL COLLECTIONS', value: 'all' },
    ...allCategories.map((c) => ({ label: c.label.toUpperCase(), value: c.id as Category })),
  ];

  return (
    <>
      <header
        id="app-header"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled
          ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-2'
          : 'bg-gradient-to-b from-black/90 to-transparent py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Trigger */}
          <button
            id="mobile-menu-trigger"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-white/80 hover:text-white p-1 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <a
              href="#"
              onClick={() => onSelectCategory('all')}
              className="hover:opacity-95 transition-opacity flex items-center"
            >
              <DarvkLogo />
            </a>
          </div>

          {/* Center Navigation */}
          <nav className="hidden lg:flex flex-1 justify-center items-center space-x-4 xl:space-x-8 px-4">
            <button onClick={() => onSelectCategory('all')} className="text-[10px] lg:text-xs font-bold tracking-[0.15em] text-white/90 hover:text-white transition-all uppercase">WOMEN</button>
            <button onClick={() => onSelectCategory('all')} className="text-[10px] lg:text-xs font-bold tracking-[0.15em] text-white/90 hover:text-white transition-all uppercase">MEN</button>
            <button onClick={() => onSelectCategory('accessories')} className="text-[10px] lg:text-xs font-bold tracking-[0.15em] text-white/90 hover:text-white transition-all uppercase">ACCESSORIES</button>
            <button onClick={() => { }} className="text-[10px] lg:text-xs font-bold tracking-[0.15em] text-white/90 hover:text-white transition-all uppercase whitespace-nowrap">GIFT CARDS</button>
          </nav>

          {/* Actions Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
            {/* Search Bar */}
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.input
                    id="nav-search-input"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 140, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    type="text"
                    placeholder="Search gear..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="bg-white/10 text-white placeholder-white/40 text-[10px] sm:text-xs px-3 py-1.5 rounded-full border border-white/20 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 mr-2"
                  />
                )}
              </AnimatePresence>
              <button
                id="search-toggle-btn"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>



            {/* Country Selector */}
            <div className="relative group hidden sm:flex items-center">
              <button className="flex items-center space-x-1 p-1.5 sm:p-2 text-white/80 hover:text-white transition-all hover:scale-105">
                <img src={selectedCountry.flagUrl} alt={selectedCountry.name} className="w-5 h-auto rounded-sm shadow-sm" />
                <span className="text-[10px] font-bold">{selectedCountry.currencyCode}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-2 border-b border-white/10 bg-neutral-900 z-10">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar py-1">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountryByCode(country.code);
                          setCountrySearch('');
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors flex items-center space-x-3 ${selectedCountry.code === country.code ? 'text-white font-bold bg-white/5' : 'text-neutral-400'}`}
                      >
                        <img src={country.flagUrl} alt={country.name} className="w-5 h-auto rounded-sm shadow-sm opacity-90 group-hover:opacity-100" />
                        <span className="flex-1 truncate">{country.name}</span>
                        <span className="font-mono text-neutral-500 text-[10px]">{country.currencyCode}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-neutral-500 text-center">No countries found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-white/80 hover:text-white transition-all hover:scale-105"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Unified Account / Admin Profile */}
            {/* Unified Account Profile */}
            {isUserLoggedIn ? (
              <div className="relative group flex items-center">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-1.5 p-1.5 sm:p-2 text-white/80 hover:text-white transition-all hover:scale-105"
                  aria-label="Account"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span className="hidden md:inline text-[10px] font-semibold tracking-wider uppercase text-red-600">
                    {currentUser?.firstName || 'ACCOUNT'}
                  </span>
                </button>
                <div className={`absolute right-0 top-full mt-2 w-48 bg-[#0c0c0c] border border-white/10 rounded-lg shadow-2xl transition-all duration-200 z-50 overflow-hidden flex flex-col pt-1 pb-1 ${isUserDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                  {isAdmin && (
                    <button
                      onClick={onOpenAdminDashboard}
                      className="w-full text-left px-4 py-3 text-[10px] font-black tracking-[0.15em] text-red-500 hover:bg-white/5 transition-colors flex items-center space-x-3 border-b border-white/5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>ADMIN PANEL</span>
                    </button>
                  )}
                  {!isAdmin && (
                    <button
                      onClick={onOpenUserProfile}
                      className="w-full text-left px-4 py-3 text-[10px] font-bold tracking-[0.15em] text-white/90 hover:text-white hover:bg-white/5 transition-colors flex items-center space-x-3 border-b border-white/5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>ORDER HISTORY</span>
                    </button>
                  )}
                  <button
                    onClick={() => logoutUser()}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold tracking-[0.15em] text-neutral-400 hover:text-white hover:bg-white/5 transition-colors flex items-center space-x-3"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>LOG OUT</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenUserAuth}
                className="flex items-center space-x-1.5 p-1.5 sm:p-2 text-white/80 hover:text-white transition-all hover:scale-105"
                aria-label="Sign In"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden md:inline text-[10px] font-semibold tracking-wider">
                  SIGN IN
                </span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              id="cart-trigger-btn"
              onClick={onOpenCart}
              className="relative p-1.5 sm:p-2 text-white/80 hover:text-white transition-all hover:scale-105"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={cartCount}
                  className="absolute -top-1 -right-1 bg-red-600 text-white font-mono font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              id="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            />
            <motion.div
              id="mobile-menu-content"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-[80%] max-w-sm bg-[#050505] border-r border-white/5 p-6 z-55 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <DarvkLogo />
                  <button
                    id="mobile-menu-close"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex flex-col space-y-6 mt-8">
                  <button onClick={() => { onSelectCategory('all'); setIsMobileMenuOpen(false); }} className="text-left text-lg font-black tracking-widest text-white hover:text-red-500 transition-all uppercase">WOMEN</button>
                  <button onClick={() => { onSelectCategory('all'); setIsMobileMenuOpen(false); }} className="text-left text-lg font-black tracking-widest text-white hover:text-red-500 transition-all uppercase">MEN</button>
                  <button onClick={() => { onSelectCategory('accessories'); setIsMobileMenuOpen(false); }} className="text-left text-lg font-black tracking-widest text-white hover:text-red-500 transition-all uppercase">ACCESSORIES</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); }} className="text-left text-lg font-black tracking-widest text-white hover:text-red-500 transition-all uppercase">GIFT CARDS</button>
                </nav>
              </div>

              <div className="border-t border-white/5 pt-6 flex flex-col space-y-4">
                <div className="flex items-center space-x-3 text-white/80">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-bold tracking-[0.15em]">MEMBER ACCOUNT</span>
                </div>
                <div className="flex items-center space-x-2 text-white/40 text-[10px] tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>SECURE ACCESS ENCRYPTED</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
