import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMaintenanceMode } from '../../api/settings';
import { getCurrentUser, logout } from '../../utils/auth';

export default function Maintenance() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check maintenance mode periodically
    const checkMaintenance = async () => {
      try {
        const isMaintenance = await getMaintenanceMode();
        const user = getCurrentUser();
        
        // If maintenance is off and user is authenticated, redirect to dashboard
        if (!isMaintenance && user) {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
      }
    };

    // Check immediately
    checkMaintenance();

    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <span className="material-symbols-outlined text-amber-500 text-5xl">build</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            System Under Maintenance
          </h1>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            We're currently performing scheduled maintenance to improve our services. 
            Please check back shortly.
          </p>

          {/* Additional Info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500 text-xl mt-0.5">info</span>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Estimated Time
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We expect to be back online within a few hours. Thank you for your patience.
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          LectGen-AI Platform
        </p>
      </div>
    </div>
  );
}

