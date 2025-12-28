import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { upgradeToVIP } from '../../api/user';
import { message } from 'antd';
import { QRCodeSVG } from 'qrcode.react';

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval and timeout on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
    };
  }, []);

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
        setCountdown(null);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (paymentTimeoutRef.current) {
          clearTimeout(paymentTimeoutRef.current);
          paymentTimeoutRef.current = null;
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to process payment');
      setIsProcessing(false);
      setCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }
    }
  };

  const handlePaymentButtonClick = () => {
    if (isProcessing || countdown !== null) return;

    setIsProcessing(true);
    setCountdown(15);

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // After 15 seconds, process payment
    paymentTimeoutRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      handlePaymentSuccess();
      paymentTimeoutRef.current = null;
    }, 15000);
  };

  // Generate QR code data for Momo payment
  // Bạn có thể thay đổi định dạng này theo yêu cầu của Momo API hoặc mã QR thực tế của bạn
  // Ví dụ: có thể là URL thanh toán Momo, hoặc chuỗi dữ liệu theo format của Momo
  const generateQRData = () => {
    // Option 1: Sử dụng format hiện tại (custom format)
    // return `LectGen-AI|VIP|${billingPeriod}|${total}|${Date.now()}`;
    
    // Option 2: Sử dụng Momo payment URL (ví dụ - thay bằng URL thực tế)
    // const orderId = `ORD-${Date.now()}`;
    // return `https://payment.momo.vn/pay?amount=${total}&orderId=${orderId}`;
    
    // Option 3: Sử dụng Momo QR code string format (ví dụ)
    // return `00020101021238570010A00000072701270006970436011406970436011506970436011606970436011706970436011806970436011906970436011100697043601${total}53037045404${total}5802VN62140706970436016630697043601`;
    
    // Hiện tại sử dụng Option 1
    return `LectGen-AI|VIP|${billingPeriod}|${total}|${Date.now()}`;
  };
  
  const qrData = generateQRData();

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

              {/* QR Code Payment */}
              <div className="space-y-6 mb-6">
                <div className="text-center">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Quét mã QR để thanh toán
                  </p>
                  <div className="bg-white p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 inline-block">
                    <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center mb-4 p-4">
                      <QRCodeSVG
                        value={qrData}
                        size={256}
                        level="H"
                        includeMargin={false}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 break-all max-w-xs mx-auto">
                      {qrData}
                    </p>
                  </div>
                </div>
                {/* Loading overlay khi đang xử lý */}
                {isProcessing && countdown !== null && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Đang xử lý thanh toán...
                        </p>
                        {countdown > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Vui lòng đợi {countdown} giây
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${((15 - (countdown || 0)) / 15) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <button
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-lg shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePaymentButtonClick}
                  disabled={isProcessing}
                >
                  {isProcessing && countdown !== null ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      <span>Đang xử lý... ({countdown}s)</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Đã thanh toán thành công</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-500 mt-4">
                By clicking the button above, you agree to our <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-sm text-slate-400">
        <p>© 2025 LectGen-AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Checkout;

