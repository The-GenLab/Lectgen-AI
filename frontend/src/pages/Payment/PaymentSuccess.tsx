import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';

interface PaymentSuccessState {
  orderId?: string;
  plan?: string;
  amount?: number;
  billingPeriod?: 'monthly' | 'yearly';
  renewalDate?: string;
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentSuccessState;
  const currentUser = getCurrentUser();

  const orderId = state?.orderId || `ORD-${Date.now().toString().slice(-5)}`;
  const plan = state?.plan || 'LectGen Monthly';
  const amount = state?.amount || 0;
  const renewalDate = state?.renewalDate || new Date().toLocaleDateString('vi-VN');

  const handleStartCreating = () => {
    navigate('/');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display transition-colors duration-300 min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#101822]/80 backdrop-blur-md px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">LectGen-AI</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span>Hỗ trợ</span>
          </button>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
          {currentUser?.avatarUrl ? (
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundImage: `url("${currentUser.avatarUrl}")` }}
            />
          ) : (
            <div className="bg-primary text-white rounded-full size-9 flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="flex flex-col max-w-[480px] w-full">
          {/* Success Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
            {/* Celebration Header */}
            <div className="flex flex-col items-center pt-10 pb-6 px-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150"></div>
                <div className="relative size-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
                </div>
              </div>
              <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed max-w-sm">
                Chào mừng bạn đến với gói VIP. Tài khoản của bạn đã được nâng cấp và sẵn sàng sử dụng.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-700 mb-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Mã đơn hàng</span>
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Gói đăng ký</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      VIP
                    </span>
                    <p className="text-slate-900 dark:text-white text-sm font-semibold text-right">{plan}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Ngày gia hạn</p>
                  <p className="text-slate-900 dark:text-white text-sm font-medium text-right">{renewalDate}</p>
                </div>
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Tổng thanh toán</p>
                  <p className="text-primary text-lg font-bold text-right">${amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-2">
              <button
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                onClick={handleStartCreating}
              >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span>Bắt đầu tạo slide VIP</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              Cần hỗ trợ? <a className="text-primary hover:underline cursor-pointer" href="#">Liên hệ CSKH</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;

