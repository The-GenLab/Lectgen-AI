import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';

const UpgradeToVIP: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const monthlyPrice = 12;
  const yearlyPrice = 144; // $12/month * 12 months = $144/year (no discount for now, but can add -20% later)
  const displayedYearlyPrice = 144; // Can be discounted to show savings

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#0d131b] dark:text-white transition-colors duration-200">
      {/* Navigation (Minimal for Upgrade Page) */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#151f2e]/80 backdrop-blur-md px-6 lg:px-10 py-4 fixed w-full top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">LectGen-AI</h2>
        </div>
        <button 
          className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"
          onClick={() => navigate('/')}
        >
          <span className="material-symbols-outlined align-middle mr-1 text-[20px]">close</span>
          Close
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          {/* Headline Section */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
              <span className="material-symbols-outlined text-[28px]">diamond</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Become a Presentation Pro
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Unlock unlimited creativity. Generate professional slides in seconds, not hours.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex justify-center pt-6 pb-2">
            <div className="relative bg-gray-200 dark:bg-gray-800 p-1.5 rounded-xl inline-flex items-center">
              <div 
                className="absolute inset-y-1.5 bg-white dark:bg-[#1e293b] rounded-lg shadow-sm transition-all duration-200 ease-out"
                style={{
                  width: 'calc(50% - 6px)',
                  left: billingPeriod === 'monthly' ? '6px' : 'calc(50% + 3px)',
                }}
              ></div>
              {/* Monthly Option */}
              <label className={`relative z-10 w-32 cursor-pointer select-none py-2 text-center text-sm font-semibold transition-colors ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
                <input 
                  className="hidden" 
                  name="billing" 
                  type="radio" 
                  value="monthly"
                  checked={billingPeriod === 'monthly'}
                  onChange={() => setBillingPeriod('monthly')}
                />
              </label>
              {/* Yearly Option */}
              <label className={`relative z-10 w-44 cursor-pointer select-none py-2 text-center text-sm font-semibold transition-colors ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Yearly <span className="ml-1 text-[10px] uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
                <input 
                  className="hidden" 
                  name="billing" 
                  type="radio" 
                  value="yearly"
                  checked={billingPeriod === 'yearly'}
                  onChange={() => setBillingPeriod('yearly')}
                />
              </label>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 pt-8 text-left max-w-3xl mx-auto">
            {/* Basic Card (Ghost/Comparison Anchor) */}
            <div className="relative flex flex-col p-6 sm:p-8 bg-white dark:bg-[#151f2e] border border-gray-200 dark:border-gray-800 rounded-2xl opacity-60 hover:opacity-100 transition-opacity duration-300">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Free Starter</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">$0</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/mo</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Perfect for trying out the generator.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1" role="list">
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-gray-400 mr-3 text-[20px]">check</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">5 slides per month</span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-gray-400 mr-3 text-[20px]">check</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Standard templates</span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-gray-400 mr-3 text-[20px]">check</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Export to LaTeX only</span>
                </li>
              </ul>
              <button 
                className={`w-full block font-semibold py-3 px-4 rounded-xl transition-colors text-center text-sm ${
                  currentUser?.role?.toUpperCase() === 'FREE'
                    ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                disabled={currentUser?.role?.toUpperCase() !== 'FREE'}
              >
                {currentUser?.role?.toUpperCase() === 'FREE' ? 'Current Plan' : 'Free Plan'}
              </button>
            </div>

            {/* VIP Card (Hero) */}
            <div className="relative flex flex-col p-6 sm:p-8 bg-white dark:bg-[#1e293b] border-2 border-primary rounded-2xl shadow-xl shadow-primary/10 transform hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Best Value</span>
              </div>
              <div className="mb-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary">VIP Pro</h3>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    ${billingPeriod === 'monthly' ? monthlyPrice : displayedYearlyPrice}
                  </span>
                  <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">
                    /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {billingPeriod === 'yearly' 
                    ? `Billed $${displayedYearlyPrice} yearly. Cancel anytime.` 
                    : `Billed $${monthlyPrice} monthly. Cancel anytime.`}
                </p>
              </div>
              <ul className="space-y-4 mb-8 flex-1" role="list">
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-0.5 mr-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Unlimited AI generated slides</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-0.5 mr-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Premium Themes & Layouts</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-0.5 mr-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Remove Watermarks</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-0.5 mr-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Export to PPTX (PowerPoint)</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-0.5 mr-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Priority Support</span>
                </li>
              </ul>
              <button 
                className="w-full block bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => navigate('/checkout', { state: { billingPeriod } })}
                disabled={currentUser?.role?.toUpperCase() === 'VIP'}
              >
                {currentUser?.role?.toUpperCase() === 'VIP' ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          </div>

          <div className="pt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Secure payment with Stripe. 14-day money-back guarantee.
            </p>
            <div className="flex justify-center gap-4 mt-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
              <div className="h-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">credit_card</span>
                <span className="text-xs font-semibold text-gray-500">VISA</span>
                <span className="text-xs font-semibold text-gray-500">Mastercard</span>
                <span className="text-xs font-semibold text-gray-500">PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UpgradeToVIP;

