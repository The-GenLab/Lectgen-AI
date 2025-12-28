import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { upgradeToVIP } from '../../api/user';
import { message } from 'antd';

interface CheckoutState {
  billingPeriod?: 'monthly' | 'yearly';
  price?: number;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckoutState;
  
  const billingPeriod = state?.billingPeriod || 'monthly';
  const monthlyPrice = 12;
  const yearlyPrice = 144;
  const price = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice;
  const tax = Math.round(price * 0.1 * 100) / 100; // 10% tax
  const total = price + tax;

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'momo'>('card');

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      const durationMonths = billingPeriod === 'monthly' ? 1 : 12;
      const response = await upgradeToVIP(durationMonths);
      
      if (response.success) {
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to success page with order details
        navigate('/payment/success', {
          state: {
            orderId: `ORD-${Date.now().toString().slice(-5)}`,
            plan: billingPeriod === 'monthly' ? 'LectGen Monthly' : 'LectGen Yearly',
            amount: total,
            billingPeriod,
            renewalDate: new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
          },
        });
      } else {
        message.error(response.message || 'Failed to process payment');
        setIsProcessing(false);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  // Generate QR code data (simple demo - in production, this would be a real payment QR)
  const qrData = `LectGen-AI|VIP|${billingPeriod}|${total}|${Date.now()}`;

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-white min-h-screen flex flex-col font-display">
      {/* Top Navigation / Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7ecf3] dark:border-slate-800 bg-white dark:bg-[#1A2633] px-6 lg:px-10 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">LectGen-AI</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">lock</span>
          <span>Secure Checkout</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center py-8 lg:py-12 px-4 sm:px-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Order Summary */}
          <section className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
            {/* Summary Card */}
            <div className="bg-white dark:bg-[#1A2633] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-xl font-bold mb-1">Order Summary</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Review your plan details before upgrading.</p>
              </div>
              <div className="p-6">
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">VIP Plan</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Billed {billingPeriod === 'monthly' ? 'monthly' : 'yearly'}
                    </p>
                    <button 
                      className="text-primary text-sm font-medium hover:underline"
                      onClick={() => navigate('/settings/upgrade')}
                    >
                      Change plan
                    </button>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-bold text-lg">${price}</p>
                    <p className="text-xs text-slate-400">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    Unlimited AI generations
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    Export to editable PPTX
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    Custom branding & themes
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    Priority 24/7 support
                  </li>
                </ul>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>${price}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 text-[#0d131b] dark:text-white border-t border-dashed border-slate-200 dark:border-slate-700 mt-2">
                    <span>Total due today</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              <div className="flex items-center gap-1 font-bold text-slate-500">
                <span className="material-symbols-outlined">verified_user</span>
                <span className="text-xs">SSL Secure</span>
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <span className="text-xs font-medium text-slate-500">Money-back guarantee</span>
            </div>
          </section>

          {/* Right Column: Payment Details */}
          <section className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white dark:bg-[#1A2633] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
              <h1 className="text-2xl font-black tracking-tight text-[#0d131b] dark:text-white mb-6">Payment Details</h1>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-8">
                <button 
                  className={`flex items-center gap-2 pb-3 px-1 border-b-[3px] transition-colors ${
                    paymentMethod === 'card' 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
                  } text-sm`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  Credit Card
                </button>
                <button 
                  className={`flex items-center gap-2 pb-3 px-1 border-b-[3px] transition-colors ${
                    paymentMethod === 'paypal' 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
                  } text-sm`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  PayPal
                </button>
                <button 
                  className={`flex items-center gap-2 pb-3 px-1 border-b-[3px] transition-colors ${
                    paymentMethod === 'momo' 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
                  } text-sm`}
                  onClick={() => setPaymentMethod('momo')}
                >
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  Momo
                </button>
              </div>

              {/* QR Code Payment (Demo) */}
              {paymentMethod === 'momo' && (
                <div className="space-y-6 mb-6">
                  <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      Quét mã QR để thanh toán
                    </p>
                    <div className="bg-white p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 inline-block">
                      <div className="w-64 h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                        {/* Simple QR Code representation - in production, use a QR code library */}
                        <div className="grid grid-cols-8 gap-1 p-4">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-sm ${
                                Math.random() > 0.5 ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {qrData}
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-lg shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePaymentSuccess}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>Đã thanh toán thành công</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Credit Card Form (Hidden for demo) */}
              {paymentMethod === 'card' && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handlePaymentSuccess(); }}>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0d131b] dark:text-slate-200" htmlFor="cardName">Name on Card</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                      <input 
                        className="block w-full pl-10 rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-white sm:text-sm py-2.5 transition-shadow" 
                        id="cardName" 
                        placeholder="John Doe" 
                        type="text"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0d131b] dark:text-slate-200" htmlFor="cardNumber">Card Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">credit_card</span>
                      </div>
                      <input 
                        className="block w-full pl-10 pr-10 rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-white sm:text-sm py-2.5 transition-shadow" 
                        id="cardNumber" 
                        placeholder="0000 0000 0000 0000" 
                        type="text"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0d131b] dark:text-slate-200" htmlFor="expiry">Expiration Date</label>
                      <input 
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-white sm:text-sm py-2.5 transition-shadow" 
                        id="expiry" 
                        placeholder="MM / YY" 
                        type="text"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0d131b] dark:text-slate-200" htmlFor="cvc">CVC / CVV</label>
                      <input 
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-white sm:text-sm py-2.5 transition-shadow" 
                        id="cvc" 
                        placeholder="123" 
                        type="text"
                        required
                      />
                    </div>
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-6 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ${total.toFixed(2)}</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* PayPal (Hidden for demo) */}
              {paymentMethod === 'paypal' && (
                <div className="space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      PayPal integration coming soon
                    </p>
                    <button
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-6 rounded-lg shadow-md transition-all active:scale-[0.99]"
                      onClick={handlePaymentSuccess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Pay with PayPal (Demo)'}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-slate-500 mt-4">
                By clicking the button above, you agree to our <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-sm text-slate-400">
        <p>© 2024 LectGen-AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Checkout;

