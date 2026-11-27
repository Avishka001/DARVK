import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Lock,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  Mail,
  Truck,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Download,
  Printer,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { CartItem, OrderDetails } from '../types';
import { DarvkLogo } from './DarvkLogo';
import * as api from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { useUser } from '../context/UserContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  discountCode: string;
  onSuccess: (orderDetails: OrderDetails) => void;
  onClearCart: () => void;
}

type CheckoutStep = 'auth' | 'billing' | 'processing' | 'receipt';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  discountCode,
  onSuccess,
  onClearCart,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('auth');
  const [processingState, setProcessingState] = useState(0);
  const { formatPrice, selectedCountry } = useCurrency();
  const { isUserLoggedIn, currentUser } = useUser();

  // Form Fields State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState(selectedCountry.name);

  // Card Credentials
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');

  // Form Errors State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [checkoutError, setCheckoutError] = useState('');

  // Created Order Record
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);

  // Reset checkout state when modal is opened
  useEffect(() => {
    if (isOpen) {
      // If user is already logged in skip the auth step
      setStep(isUserLoggedIn ? 'billing' : 'auth');
      setCompletedOrder(null);
      setProcessingState(0);
      setErrors({});
      setCheckoutError('');
      setCardNumber('');
      setCardExpiry('');
      setCardCVC('');
      setCardName('');
      // Pre-fill billing info from user account
      setEmail(currentUser?.email || '');
      setFirstName(currentUser?.firstName || '');
      setLastName(currentUser?.lastName || '');
      setAddress('');
      setCity('');
      setPostalCode('');
      setCountry(selectedCountry.name);
    }
  }, [isOpen, selectedCountry.name, isUserLoggedIn, currentUser]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountMultiplier = discountCode === 'AURA20' || discountCode === 'INCARNAGE' ? 0.2 : discountCode === 'APEX10' ? 0.1 : 0;
  const discountAmount = Math.round(subtotal * discountMultiplier);
  const total = subtotal - discountAmount;

  // Real-time card formatting helper
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    // Add spaces every 4 characters
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setCardExpiry(value);
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCVC(value);
  };

  const detectCardType = () => {
    const rawNumber = cardNumber.replace(/\s/g, '');
    if (rawNumber.startsWith('4')) return 'Visa';
    if (rawNumber.startsWith('5')) return 'Mastercard';
    if (rawNumber.startsWith('37') || rawNumber.startsWith('34')) return 'Amex';
    return 'Generic';
  };

  // Validate form details
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Please provide a valid email';
    if (!firstName.trim()) newErrors.firstName = 'First name required';
    if (!lastName.trim()) newErrors.lastName = 'Last name required';
    if (!address.trim()) newErrors.address = 'Shipping address required';
    if (!city.trim()) newErrors.city = 'City required';
    if (!postalCode.trim()) newErrors.postalCode = 'Postal zip code required';

    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15) newErrors.cardNumber = 'Provide a valid credit card number';
    if (!cardExpiry.includes('/')) newErrors.cardExpiry = 'Provide valid expiry (MM/YY)';
    if (cardCVC.length < 3) newErrors.cardCVC = 'Provide valid CVC code';
    if (!cardName.trim()) newErrors.cardName = 'Provide name on card';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startCheckoutPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setCheckoutError('');
    setStep('processing');
    setProcessingState(0);
  };

  // Processing visual animation, backed by a real order request
  useEffect(() => {
    if (step !== 'processing') return;

    const stages = [
      'Establishing secure 256-bit bank handshake...',
      'Validating billing credentials & card limits...',
      'Tokenizing debit instruction key signature...',
      'Clearing transaction funds with payment gateway...',
      'Generating purchase order invoice receipt...',
    ];

    let stageIdx = 0;
    const stageTimer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 2); // hold before the final stage until the request resolves
      setProcessingState(stageIdx);
    }, 700);

    api
      .placeOrder({
        items: cartItems.map((item) => ({
          productId: item.product.id,
          size: item.selectedSize,
          colorName: item.selectedColor.name,
          colorHex: item.selectedColor.hex,
          quantity: item.quantity,
        })),
        customerInfo: { email, firstName, lastName, address, city, postalCode, country },
        discountCode: discountCode || undefined,
        paymentMethod: 'card',
        card: { number: cardNumber, expiry: cardExpiry, name: cardName },
      })
      .then((order) => {
        clearInterval(stageTimer);
        setProcessingState(stages.length - 1);
        // Let the final "generating receipt" stage show briefly before revealing it
        setTimeout(() => {
          setCompletedOrder(order);
          setStep('receipt');
          onSuccess(order);
        }, 500);
      })
      .catch((err) => {
        clearInterval(stageTimer);
        setCheckoutError(err.message || 'Payment could not be processed. Please try again.');
        setStep('billing');
      });

    return () => clearInterval(stageTimer);
  }, [step]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const currentProcessingMessage = [
    'Establishing secure 256-bit bank handshake...',
    'Validating billing credentials & card limits...',
    'Tokenizing debit instruction key signature...',
    'Clearing transaction funds with payment gateway...',
    'Generating purchase order invoice receipt...',
  ][processingState];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050505] text-white min-h-screen">
        {/* Main Content Stage */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-16">
          {/* Header Action Row */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-white/5 mb-6 sm:mb-10">
            <button
              id="checkout-back-btn"
              onClick={step === 'receipt' ? onClearCart : onClose}
              className="flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{step === 'receipt' ? 'RETURN TO STOREFRONT' : 'BACK TO BAG'}</span>
              <span className="sm:hidden">{step === 'receipt' ? 'STOREFRONT' : 'BACK'}</span>
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <DarvkLogo className="h-5 sm:h-6" />
              <span className="text-[8px] sm:text-[10px] bg-red-600/10 text-red-500 font-mono font-bold px-2 sm:px-2.5 py-0.5 uppercase border border-red-500/10 rounded-sm">
                SECURED
              </span>
            </div>
          </div>

          {/* Steps Switchboard */}

          {/* Auth Step — prompt to login or continue as guest */}
          {step === 'auth' && (
            <div className="max-w-md mx-auto py-12">
              <div className="text-center mb-8">
                <h2 className="text-xl font-black tracking-wider uppercase text-white mb-2">Before You Checkout</h2>
                <p className="text-xs text-neutral-500">Sign in to track your orders, or continue as a guest.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Open auth modal — we signal back via a custom event
                    window.dispatchEvent(new CustomEvent('openUserAuth', { detail: { onSuccess: () => setStep('billing') } }));
                  }}
                  className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black tracking-widest text-xs uppercase rounded-lg transition-all flex items-center justify-center space-x-3"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </button>
                <button
                  onClick={() => setStep('billing')}
                  className="w-full py-4 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white font-bold tracking-widest text-xs uppercase rounded-lg transition-all"
                >
                  Continue as Guest
                </button>
              </div>
              <p className="text-center text-[10px] text-neutral-600 mt-6">
                Guest orders are not linked to an account and cannot be tracked online.
              </p>
            </div>
          )}

          {step === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12">
              {/* Left Column: Input Forms */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                {/* Express Checkout Visuals */}
                <div className="bg-[#0c0c0c] border border-white/5 p-4 sm:p-6 rounded-sm space-y-4 shadow-xl">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase block mb-2 font-mono">
                    EXPRESS DIGITAL CHECKOUT
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Google Pay Sim */}
                    <button
                      id="gpay-express-btn"
                      type="button"
                      onClick={() => {
                        setEmail('member.buyer@gmail.com');
                        setFirstName('John');
                        setLastName('Miller');
                        setAddress('1048 Westwood Boulevard');
                        setCity('Los Angeles');
                        setPostalCode('90024');
                        setCardNumber('4111 2222 3333 4444');
                        setCardExpiry('12/28');
                        setCardCVC('992');
                        setCardName('John Miller');
                        alert('Google Pay profile token synchronized! Details prefilled.');
                      }}
                      className="bg-black hover:bg-zinc-900 border border-white/10 text-white py-2.5 sm:py-3.5 rounded-sm font-black text-[10px] sm:text-xs flex items-center justify-center space-x-2 sm:space-x-2.5 transition-all uppercase tracking-widest cursor-pointer shadow-md hover:scale-[1.01]"
                    >
                      <span className="font-extrabold text-neutral-300">Google Pay</span>
                    </button>

                    {/* Apple Pay Sim */}
                    <button
                      id="applepay-express-btn"
                      type="button"
                      onClick={() => {
                        setEmail('member.buyer@gmail.com');
                        setFirstName('John');
                        setLastName('Miller');
                        setAddress('1048 Westwood Boulevard');
                        setCity('Los Angeles');
                        setPostalCode('90024');
                        setCardNumber('5520 4433 2211 9900');
                        setCardExpiry('08/29');
                        setCardCVC('415');
                        setCardName('John Miller');
                        alert('Apple Pay profile wallet token synchronized! Details prefilled.');
                      }}
                      className="bg-white hover:bg-neutral-200 text-black py-2.5 sm:py-3.5 rounded-sm font-black text-[10px] sm:text-xs flex items-center justify-center space-x-2 sm:space-x-2.5 transition-all uppercase tracking-widest cursor-pointer shadow-md hover:scale-[1.01]"
                    >
                      <span className="font-extrabold text-neutral-900">Apple Pay</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={startCheckoutPayment} className="space-y-6 sm:space-y-8">
                  {checkoutError && (
                    <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                      <span className="text-xs text-red-400 font-bold tracking-wide">{checkoutError}</span>
                    </div>
                  )}
                  {/* Customer Information */}
                  <div>
                    <h3 className="text-sm font-black tracking-widest uppercase mb-4 text-white flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-red-500" />
                      <span>1. CUSTOMER IDENTITY & CORRESPONDENCE</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          EMAIL ADDRESS (FOR RECEIPT INVOICING)
                        </label>
                        <input
                          id="checkout-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full bg-neutral-900 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-red-600'
                            } focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold`}
                        />
                        {errors.email && (
                          <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                            {errors.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="text-sm font-black tracking-widest uppercase mb-4 text-white flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-red-500" />
                      <span>2. CARRIER SHIPPING DESTINATION</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          FIRST NAME
                        </label>
                        <input
                          id="checkout-firstname"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold"
                        />
                        {errors.firstName && (
                          <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                            {errors.firstName}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          LAST NAME
                        </label>
                        <input
                          id="checkout-lastname"
                          type="text"
                          placeholder="Miller"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold"
                        />
                        {errors.lastName && (
                          <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                            {errors.lastName}
                          </span>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          STREET DELIVERY ADDRESS
                        </label>
                        <input
                          id="checkout-address"
                          type="text"
                          placeholder="1048 Westwood Boulevard"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold"
                        />
                        {errors.address && (
                          <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                            {errors.address}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          CITY / DISTRICT
                        </label>
                        <input
                          id="checkout-city"
                          type="text"
                          placeholder="Los Angeles"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold"
                        />
                        {errors.city && (
                          <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                            {errors.city}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          POSTAL CODE / ZIP
                        </label>
                        <input
                          id="checkout-zip"
                          type="text"
                          placeholder="90024"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold"
                        />
                        {errors.postalCode && (
                          <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                            {errors.postalCode}
                          </span>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                          COUNTRY / REGION
                        </label>
                        <select
                          id="checkout-country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 focus:border-red-600 focus:outline-none px-4 py-3 text-xs rounded-lg tracking-wider font-semibold text-white"
                        >
                          <option value="United States">United States (USA)</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom (UK)</option>
                          <option value="Australia">Australia</option>
                          <option value="Sri Lanka">Sri Lanka</option>
                          <option value="Germany">Germany</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment gateway specifications */}
                  <div>
                    <h3 className="text-sm font-black tracking-widest uppercase mb-4 text-white flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-red-500" />
                      <span>3. ENCRYPTED PAYMENT PORTAL</span>
                    </h3>
                    <div className="bg-neutral-900 border border-white/5 p-6 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-bold tracking-widest uppercase">SECURE PAYMENT INSTRUCTION</span>
                        <div className="flex space-x-2">
                          <span className="text-[9px] bg-white/5 px-2 py-0.5 font-mono text-neutral-400 border border-white/10 uppercase">
                            {detectCardType()} CARD DETECTED
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                            CARD NUMBER
                          </label>
                          <div className="relative">
                            <input
                              id="card-number-input"
                              type="text"
                              placeholder="4111 2222 3333 4444"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 focus:outline-none pl-10 pr-4 py-3 text-xs rounded-lg tracking-widest font-mono text-white"
                            />
                            <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          </div>
                          {errors.cardNumber && (
                            <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                              {errors.cardNumber}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                            EXPIRATION DATE
                          </label>
                          <div className="relative">
                            <input
                              id="card-expiry-input"
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 focus:outline-none pl-10 pr-4 py-3 text-xs rounded-lg tracking-widest font-mono text-white"
                            />
                            <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          </div>
                          {errors.cardExpiry && (
                            <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                              {errors.cardExpiry}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                            CARD VERIFICATION VALUE (CVC)
                          </label>
                          <div className="relative">
                            <input
                              id="card-cvc-input"
                              type="password"
                              placeholder="•••"
                              value={cardCVC}
                              onChange={handleCVCChange}
                              className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 focus:outline-none pl-10 pr-4 py-3 text-xs rounded-lg tracking-widest font-mono text-white"
                            />
                            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          </div>
                          {errors.cardCVC && (
                            <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                              {errors.cardCVC}
                            </span>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold tracking-widest text-neutral-400 block mb-1.5 uppercase">
                            CARDHOLDER FULL NAME
                          </label>
                          <div className="relative">
                            <input
                              id="card-name-input"
                              type="text"
                              placeholder="John Miller"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              className="w-full bg-neutral-950 border border-white/10 focus:border-red-600 focus:outline-none pl-10 pr-4 py-3 text-xs rounded-lg tracking-wider font-semibold text-white uppercase"
                            />
                            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          </div>
                          {errors.cardName && (
                            <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase tracking-wider">
                              {errors.cardName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit checkout Form */}
                  <div className="pt-4">
                    <button
                      id="checkout-pay-btn"
                      type="submit"
                      className="w-full py-4.5 bg-red-600 hover:bg-red-700 text-white font-bold tracking-[0.2em] text-xs flex items-center justify-center space-x-3.5 transition-all uppercase rounded-lg shadow-2xl hover:scale-[1.01]"
                    >
                      <Lock className="w-4 h-4" />
                      <span>AUTHORIZE SECURE PAYMENT: ${total}.00</span>
                    </button>
                    <div className="flex items-center justify-center space-x-4 mt-4 text-[10px] text-neutral-500 font-mono tracking-wider">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>PCI-DSS CERTIFIED</span>
                      </div>
                      <span>•</span>
                      <span>3D SECURE ENFORCED</span>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Order Summary Checklist */}
              <div className="lg:col-span-5 bg-[#0c0c0c] border border-white/5 p-6 sm:p-8 rounded-sm h-fit space-y-6 shadow-xl">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase font-mono">
                    ORDER BLUEPRINT
                  </span>
                  <h3 className="text-lg font-black tracking-wider uppercase mt-1 font-display italic">BAG DETAILS</h3>
                </div>

                {/* Items stream */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                  {cartItems.map((item, idx) => (
                    <div
                      key={`${item.product.id}-${idx}`}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 bg-[#050505] rounded-sm overflow-hidden flex-shrink-0 border border-white/5">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-white line-clamp-1 flex items-center space-x-2">
                            <span>{item.product.name}</span>
                            {item.product.gender && item.product.gender !== 'unisex' && (
                              <span className="text-[8px] bg-red-600/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">
                                {item.product.gender}
                              </span>
                            )}
                          </h4>
                          <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">
                            SIZE: {item.selectedSize} • QTY: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-white">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculations Row list */}
                <div className="space-y-2.5 pt-4 border-t border-white/5 text-xs font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>ITEMS SUBTOTAL</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>VOUCHER DISCOUNT ({discountCode})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>SHIPPING CARRIER</span>
                    <span className="text-emerald-400 font-black uppercase font-sans tracking-widest text-[10px]">
                      COMPLIMENTARY
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESTIMATED TAX</span>
                    <span>$0.00</span>
                  </div>
                </div>

                {/* Calculations final Total block */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-baseline">
                  <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">GRAND TOTAL</span>
                  <span className="text-2xl font-black text-white font-mono">{formatPrice(total)}</span>
                </div>

                {/* Secure checkout seals info banner */}
                <div className="bg-[#050505] border border-white/5 p-4 rounded-sm flex items-start space-x-3 mt-4">
                  <Building2 className="w-4.5 h-4.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-zinc-400 leading-relaxed tracking-wider">
                    <span className="font-black text-white uppercase block mb-1 font-mono">
                      DARVK SHIPMENT DIRECTIVE
                    </span>
                    Our shipping department operates from primary hubs worldwide. Tracking codes will dispatch within 24 business hours. Enjoy completely covered delivery and sizing protection support.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 max-w-md mx-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-red-600 animate-spin" />
                <Lock className="w-6 h-6 text-red-500 absolute top-5 left-5" />
              </div>
              <h3 className="text-lg font-black tracking-widest uppercase">
                AUTHORIZING TRANSACTION
              </h3>
              <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest bg-neutral-900 border border-white/5 py-3 px-6 rounded-lg w-full flex items-center justify-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-spin" />
                <span>{currentProcessingMessage}</span>
              </div>
              <span className="text-[10px] text-neutral-500 tracking-widest uppercase font-sans">
                DO NOT REFRESH PAGE OR HIT REVERSE INTERACTION
              </span>
            </div>
          )}

          {step === 'receipt' && completedOrder && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="max-w-3xl mx-auto space-y-8 print:bg-white print:text-black"
            >
              {/* Order Success Top card banner */}
              <div className="bg-gradient-to-r from-red-950/20 via-neutral-900 to-neutral-900 border border-white/10 p-8 rounded-xl flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 shadow-2xl">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-sm uppercase tracking-widest font-mono border border-emerald-500/20">
                    TRANSACTION CONFIRMED
                  </span>
                  <h2 className="text-2xl font-black tracking-wider uppercase mt-3">
                    YOUR ORDER HAS BEEN PLACED!
                  </h2>
                  <p className="text-neutral-300 text-xs mt-2 tracking-wide">
                    Thank you for joining the DARVK elite. A detailed receipt invoice has been dispatched to{' '}
                    <span className="font-bold text-white">{completedOrder.customerInfo.email}</span>.
                  </p>
                </div>
              </div>

              {/* Order Invoice Block Sheet */}
              <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl print:bg-white print:text-black print:border-black">
                {/* Invoice Heading */}
                <div className="p-6 sm:p-8 border-b border-white/10 bg-neutral-950 flex flex-col sm:flex-row justify-between items-start sm:items-center print:bg-white print:border-black">
                  <div>
                    <span className="text-[10px] font-bold text-red-500 tracking-[0.2em] uppercase">
                      OFFICIAL PAYMENT RECEIPT
                    </span>
                    <h3 className="text-xl font-black text-white uppercase mt-1 tracking-wider print:text-black">
                      INVOICE {completedOrder.id}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right mt-4 sm:mt-0 font-mono text-xs text-neutral-400 print:text-black">
                    <div>DATE: {completedOrder.date}</div>
                    <div className="mt-1">GATEWAY: DEBIT_CARD_SECURE</div>
                  </div>
                </div>

                {/* Customer delivery data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8 border-b border-white/5 print:border-black">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase block mb-2">
                      BILL TO & SHIP TO:
                    </span>
                    <div className="text-xs space-y-1 font-semibold text-neutral-200 print:text-black">
                      <div className="text-sm font-bold text-white uppercase print:text-black">
                        {completedOrder.customerInfo.firstName} {completedOrder.customerInfo.lastName}
                      </div>
                      <div>{completedOrder.customerInfo.address}</div>
                      <div>
                        {completedOrder.customerInfo.city}, {completedOrder.customerInfo.postalCode}
                      </div>
                      <div className="uppercase">{completedOrder.customerInfo.country}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase block mb-2">
                      DELIVERY PROTOCOL:
                    </span>
                    <div className="text-xs space-y-1 font-semibold text-neutral-200 print:text-black">
                      <div className="text-white font-bold print:text-black">DARVK GLOBAL EXPEDITED</div>
                      <div>Estimated Arrival: 3-5 Business Days</div>
                      <div className="text-[10px] text-red-500 font-mono font-bold tracking-widest uppercase">
                        TRACKING CODE EMAILED WITHIN 24H
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items ordered details table list */}
                <div className="p-6 sm:p-8 space-y-4">
                  <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase block mb-2">
                    ACQUIRED GEAR METRICS:
                  </span>
                  <div className="space-y-4">
                    {completedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs pb-3 border-b border-white/5 last:border-b-0 last:pb-0 print:border-black"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-neutral-400 font-bold bg-neutral-950 px-2.5 py-1 rounded-sm text-[10px] print:border print:border-black">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-bold uppercase text-white print:text-black">
                              {item.product.name}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-mono block mt-0.5 uppercase">
                              SIZE: {item.selectedSize} • COLOR: {item.selectedColor.name}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-white print:text-black">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial breakdown receipt card */}
                <div className="bg-neutral-950 p-6 sm:p-8 flex flex-col items-end space-y-2 border-t border-white/10 print:bg-white print:border-black">
                  <div className="flex justify-between w-full sm:w-80 text-xs font-mono text-neutral-400 print:text-black">
                    <span>ITEMS SUBTOTAL:</span>
                    <span className="text-white print:text-black">{formatPrice(completedOrder.subtotal || 0)}</span>
                  </div>
                  {(completedOrder.discountAmount ?? 0) > 0 && (
                    <div className="flex justify-between w-full sm:w-80 text-xs font-mono text-emerald-400">
                      <span>VOUCHER DISCOUNT:</span>
                      <span>-{formatPrice(completedOrder.discountAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-full sm:w-80 text-xs font-mono text-neutral-400 print:text-black">
                    <span>SHIPPING CARRIER:</span>
                    <span className="text-emerald-400 font-bold font-sans text-[10px] uppercase">
                      COMPLIMENTARY
                    </span>
                  </div>
                  <div className="flex justify-between w-full sm:w-80 text-sm font-bold pt-3 border-t border-white/5 items-baseline print:border-black">
                    <span className="text-white uppercase tracking-widest text-[10px] print:text-black">
                      AMOUNT PAID ({selectedCountry.currencyCode}):
                    </span>
                    <span className="text-lg font-black text-white font-mono print:text-black">
                      {formatPrice(completedOrder.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Utility Print Dispatch action row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 print:hidden">
                <button
                  id="receipt-print-btn"
                  onClick={handlePrint}
                  className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-6 py-3.5 text-xs font-bold tracking-widest uppercase rounded-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <Printer className="w-4 h-4 text-neutral-400" />
                  <span>PRINT INVOICE RECEIPT</span>
                </button>
                <button
                  id="receipt-store-return-btn"
                  onClick={onClearCart}
                  className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black px-8 py-3.5 text-xs font-bold tracking-widest uppercase rounded-lg flex items-center justify-center space-x-2 transition-all shadow-lg hover:scale-[1.01]"
                >
                  <span>CONTINUE EXERCISE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
