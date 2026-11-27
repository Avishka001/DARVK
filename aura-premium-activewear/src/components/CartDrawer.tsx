import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, TicketPercent } from 'lucide-react';
import { CartItem } from '../types';
import * as api from '../api';
import { useCurrency } from '../context/CurrencyContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (idx: number, newQty: number) => void;
  onRemoveItem: (idx: number) => void;
  onCheckout: (discountCode: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [activeDiscount, setActiveDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const { formatPrice } = useCurrency();

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = activeDiscount ? Math.round(subtotal * (activeDiscount.percent / 100)) : 0;
  const total = subtotal - discountAmount;

  const handleApplyPromo = async () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setIsValidatingPromo(true);
    try {
      const result = await api.validateDiscount(code);
      if (result.valid) {
        setActiveDiscount({ code, percent: result.percentOff });
        setPromoCode('');
      } else {
        setPromoError('INVALID VOUCHER CODE. TRY "AURA20"');
      }
    } catch {
      setPromoError('COULD NOT VERIFY CODE. TRY AGAIN.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setActiveDiscount(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Shadow overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
          />

          {/* Sliding Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-[#0c0c0c] border-l border-white/5 z-50 flex flex-col justify-between shadow-2xl text-white rounded-l-sm"
          >
            {/* Cart Header */}
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-[#050505]">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <span className="text-xs sm:text-sm font-black italic tracking-widest uppercase font-display">
                  TRAINING GEAR BAG ({cartItems.length})
                </span>
              </div>
              <button
                id="cart-drawer-close"
                onClick={onClose}
                className="text-white/60 hover:text-white p-1.5 rounded-sm hover:bg-white/5 transition-all"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Item Stream Workspace */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-16 h-16 text-white/10 mb-4 animate-bounce" />
                  <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-4">
                    YOUR TRAINING BAG IS EMPTY
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-white text-black text-[10px] font-black px-6 py-3 rounded-md tracking-widest uppercase hover:bg-neutral-200 transition-colors"
                  >
                    CONTINUE BROWSING
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <motion.div
                    key={`${item.product.id}-${item.selectedSize}-${idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex space-x-4 pb-6 border-b border-white/5"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-20 h-20 bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider line-clamp-1 flex items-center space-x-2">
                            <span>{item.product.name}</span>
                            {item.product.gender && item.product.gender !== 'unisex' && (
                              <span className="text-[8px] bg-red-600/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">
                                {item.product.gender}
                              </span>
                            )}
                          </h4>
                          <span className="font-mono text-xs font-bold text-white pl-2">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-neutral-400 font-mono">
                          <span className="uppercase">SIZE: {item.selectedSize}</span>
                          <span>|</span>
                          <span className="flex items-center space-x-1 uppercase">
                            <span>COLOR: {item.selectedColor.name}</span>
                            <span
                              style={{ backgroundColor: item.selectedColor.hex }}
                              className="w-2 h-2 rounded-full ring-1 ring-white/20"
                            />
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controller & Trash Trigger */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-1.5 bg-neutral-950 border border-white/10 rounded-sm">
                          <button
                            onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono text-[10px] font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(idx, Math.min(item.product.stock, item.quantity + 1))}
                            disabled={item.quantity >= item.product.stock}
                            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm disabled:opacity-20 disabled:pointer-events-none"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-neutral-500 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Cart Calculations Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#050505] border-t border-white/5">
                {/* Promo Codes Form */}
                <div className="mb-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        id="promo-code-input"
                        type="text"
                        placeholder="ENTER VOUCHER CODE (AURA20)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full bg-[#0c0c0c] border border-white/5 focus:border-red-600 focus:outline-none pl-9 pr-3 py-2 text-[10px] font-mono rounded-sm text-white placeholder-white/25 tracking-widest"
                      />
                    </div>
                    <button
                      id="apply-promo-btn"
                      onClick={handleApplyPromo}
                      disabled={isValidatingPromo}
                      className="bg-[#050505] hover:bg-white hover:text-black font-mono font-bold text-[10px] px-4 py-2 rounded-sm transition-all uppercase tracking-widest border border-white/5 cursor-pointer disabled:opacity-50"
                    >
                      {isValidatingPromo ? '...' : 'APPLY'}
                    </button>
                  </div>
                  {promoError && (
                    <span className="text-[9px] text-red-500 font-bold block mt-1 tracking-wider uppercase">
                      {promoError}
                    </span>
                  )}
                  {activeDiscount && (
                    <div className="mt-2 inline-flex items-center space-x-1.5 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-sm text-[9px] font-mono tracking-wider">
                      <TicketPercent className="w-3.5 h-3.5" />
                      <span>CODE APPLIED: {activeDiscount.code} (-{activeDiscount.percent}%)</span>
                      <button
                        onClick={handleRemovePromo}
                        className="hover:text-white pl-1.5 focus:outline-none"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Calculation Rows */}
                <div className="space-y-2 pb-4 border-b border-white/5">
                  <div className="flex justify-between text-xs tracking-wider text-neutral-400 font-mono">
                    <span>BAG SUBTOTAL</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs tracking-wider text-emerald-400 font-mono">
                      <span>VOUCHER DISCOUNT</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs tracking-wider text-neutral-400 font-mono">
                    <span>SHIPPING (WORLDWIDE)</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold font-sans">
                      COMPLIMENTARY
                    </span>
                  </div>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-baseline pt-4 mb-6">
                  <span className="text-xs font-bold tracking-widest uppercase">ORDER TOTAL</span>
                  <span className="text-2xl font-black text-white font-mono">{formatPrice(total)}</span>
                </div>

                {/* Action CTA */}
                <button
                  id="checkout-trigger-btn"
                  onClick={() => onCheckout(activeDiscount?.code || '')}
                  className="w-full py-4.5 bg-red-600 hover:bg-red-700 text-white font-black tracking-[0.2em] text-xs flex items-center justify-center space-x-2 transition-all uppercase rounded-sm shadow-xl hover:scale-[1.01] cursor-pointer"
                >
                  <span>SECURE DEBIT/CREDIT CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center space-x-2 mt-4 text-[9px] text-neutral-500 font-mono tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-BIT ENCRYPTION SECURED CORES</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
