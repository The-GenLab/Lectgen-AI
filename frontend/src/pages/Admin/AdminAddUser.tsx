import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { createUser } from '../../api/admin';
import { message } from 'antd';

export default function AdminAddUser() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        role: 'FREE',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            message.error('Full name is required');
            return;
        }

        if (!formData.email.trim()) {
            message.error('Email address is required');
            return;
        }

        if (!formData.password) {
            message.error('Password is required');
            return;
        }

        if (formData.password.length < 6) {
            message.error('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.passwordConfirmation) {
            message.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await createUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role as 'FREE' | 'VIP' | 'ADMIN',
            });

            message.success('User created successfully!');
            navigate('/admin/users');
        } catch (err: any) {
            console.error('Failed to create user:', err);
            message.error(err.response?.data?.message || err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="flex mb-5">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-base mr-2">people</span>
                                    User Management
                                </button>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-gray-400 text-lg">chevron_right</span>
                                    <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-200 md:ml-2">Create User</span>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* Form Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden transition-colors duration-200">
                        <div className="p-6 md:p-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">User Information</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the details to create a new account for LectGen-AI.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name and Email */}
                                <div className="grid grid-cols-1 gap-y-6 gap-x-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">
                                            Full Name
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="material-symbols-outlined text-gray-400 text-lg">person</span>
                                            </div>
                                            <input
                                                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 transition-colors"
                                                id="name"
                                                name="name"
                                                placeholder="e.g. Nguyen Thanh Binh"
                                                type="text"
                                                value={formData.name}
                                                onChange={handleInputChange}
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
                                                <span className="material-symbols-outlined text-gray-400 text-lg">email</span>
                                            </div>
                                            <input
                                                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 transition-colors"
                                                id="email"
                                                name="email"
                                                placeholder="user@domain.com"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="grid grid-cols-1 gap-y-6 gap-x-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="role">
                                            Assign Role
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
                                                id="role"
                                                name="role"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                            >
                                                <option value="FREE">FREE Plan</option>
                                                <option value="VIP">VIP Plan</option>
                                                <option value="ADMIN">Administrator</option>
                                            </select>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Controls user permissions and quota.</p>
                                    </div>
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
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">lock</span>
                                                </div>
                                                <input
                                                    className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 transition-colors"
                                                    id="password"
                                                    name="password"
                                                    placeholder="••••••••"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="passwordConfirmation">
                                                Confirm Password
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">lock_reset</span>
                                                </div>
                                                <input
                                                    className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 transition-colors"
                                                    id="passwordConfirmation"
                                                    name="passwordConfirmation"
                                                    placeholder="••••••••"
                                                    type="password"
                                                    value={formData.passwordConfirmation}
                                                    onChange={handleInputChange}
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/users')}
                                        className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        <span className="material-symbols-outlined text-sm mr-2">add</span>
                                        {loading ? 'Creating...' : 'Add User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                        Need help? Refer to the <a className="text-primary hover:underline" href="#">Admin Documentation</a> for user roles.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}

