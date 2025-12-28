import { useState, FormEvent } from 'react';
import { createUser } from '../api/admin';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'FREE',
    password: '',
    passwordConfirmation: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.passwordConfirmation) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role.toUpperCase(),
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'FREE',
        password: '',
        passwordConfirmation: '',
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        role: 'FREE',
        password: '',
        passwordConfirmation: '',
      });
      setError('');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-4xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-4">
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={handleClose}
                disabled={loading}
              >
                <span className="material-icons-round text-xl">arrow_back</span>
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New User</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex mb-5">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <span className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="material-icons-round text-base mr-2">people</span>
                    User Management
                  </span>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="material-icons-round text-gray-400 text-lg">chevron_right</span>
                    <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-200 md:ml-2">Create User</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">User Information</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the details to create a new account for LectGen-AI.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Name and Email */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons-round text-gray-400 text-lg">person</span>
                    </div>
                    <input
                      className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-colors"
                      id="name"
                      name="name"
                      placeholder="e.g. Nguyen Thanh Binh"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
                    Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons-round text-gray-400 text-lg">email</span>
                    </div>
                    <input
                      className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-colors"
                      id="email"
                      name="email"
                      placeholder="user@domain.com"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="role">
                  Assign Role
                </label>
                <div className="mt-1">
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg dark:bg-gray-800 dark:text-white transition-colors"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={loading}
                    required
                  >
                    <option value="FREE">FREE Plan</option>
                    <option value="VIP">VIP Plan</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Controls user permissions and quota.</p>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Password Fields */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Security Credentials</h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                      Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons-round text-gray-400 text-lg">lock</span>
                      </div>
                      <input
                        className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-colors"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={loading}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password_confirmation">
                      Confirm Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons-round text-gray-400 text-lg">lock_reset</span>
                      </div>
                      <input
                        className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-colors"
                        id="password_confirmation"
                        name="password_confirmation"
                        placeholder="••••••••"
                        type="password"
                        value={formData.passwordConfirmation}
                        onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                        disabled={loading}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button
                  className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  <span className="material-icons-round text-sm mr-2">add</span>
                  {loading ? 'Creating...' : 'Add User'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              Need help? Refer to the <a className="text-primary hover:underline" href="#">Admin Documentation</a> for user roles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

