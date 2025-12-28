import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getBillingStats, getRevenueTrend, deleteUser } from '../../api/admin';
import { getAvatarUrl } from '../../utils/file';
import type { BillingStats, RevenueTrendResponse } from '../../api/admin';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { message } from 'antd';

type DateRangeOption = '7d' | '30d' | '90d' | 'all';
type PlanTypeFilter = 'all' | 'monthly' | 'yearly';

const AdminSubscriptions = () => {
    const navigate = useNavigate();
    const [billingData, setBillingData] = useState<BillingStats | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
    const [planTypeFilter, setPlanTypeFilter] = useState<PlanTypeFilter>('all');
    const [tempPlanTypeFilter, setTempPlanTypeFilter] = useState<PlanTypeFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchBillingData();
    }, []);

    useEffect(() => {
        fetchRevenueTrend();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const data = await getBillingStats();
            setBillingData(data);
        } catch (err) {
            console.error('Failed to fetch billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenueTrend = async () => {
        try {
            setChartLoading(true);
            const now = new Date();
            let startDate: Date;
            
            switch (dateRange) {
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                default: // 'all'
                    startDate = new Date(0); // Beginning of time
                    break;
            }

            const data = await getRevenueTrend({
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
            });
            setRevenueTrend(data);
        } catch (err) {
            console.error('Failed to fetch revenue trend:', err);
            message.error('Failed to load revenue trend data');
        } finally {
            setChartLoading(false);
        }
    };

    const handleExportReport = () => {
        if (!billingData) {
            message.warning('No data to export');
            return;
        }

        // Create CSV content
        const headers = ['Name', 'Email', 'Plan Type', 'Amount', 'Payment Date', 'Subscription Start', 'Subscription Expires'];
        const rows = billingData.subscribers.map(sub => [
            sub.name || '',
            sub.email,
            sub.planType === 'yearly' ? 'Yearly' : 'Monthly',
            `$${sub.amount.toFixed(2)}`,
            sub.paymentDate ? new Date(sub.paymentDate).toLocaleDateString() : 'N/A',
            sub.subscriptionStartDate ? new Date(sub.subscriptionStartDate).toLocaleDateString() : 'N/A',
            sub.subscriptionExpiresAt ? new Date(sub.subscriptionExpiresAt).toLocaleDateString() : 'N/A',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `billing-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('Report exported successfully');
    };

    const handleManagePlans = () => {
        message.info('Plan management feature coming soon. You can manage subscription plans in Settings.');
        // In the future, this could navigate to a plan management page
        // navigate('/admin/plans');
    };

    // Filter subscribers by search query and filters
    const vipSubscribers = useMemo(() => {
        if (!billingData) return [];
        
        return billingData.subscribers.filter(subscriber => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = (
                    subscriber.name?.toLowerCase().includes(query) ||
                    subscriber.email?.toLowerCase().includes(query)
                );
                if (!matchesSearch) return false;
            }

            // Plan type filter
            if (planTypeFilter !== 'all') {
                if (subscriber.planType !== planTypeFilter) return false;
            }

            return true;
        });
    }, [billingData, searchQuery, planTypeFilter]);

    const getUserInitials = (name: string, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return email?.[0]?.toUpperCase() || 'U';
    };

    // Click outside to close filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const filterContainer = document.querySelector('[data-filter-container]');
            if (showFilters && filterContainer && !filterContainer.contains(target)) {
                setShowFilters(false);
            }
            // Close user menu if clicking outside
            if (openMenuId && !target.closest(`[data-user-menu="${openMenuId}"]`)) {
                setOpenMenuId(null);
            }
        };

        if (showFilters || openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showFilters, openMenuId]);

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            try {
                await deleteUser(userId);
                message.success('User deleted successfully');
                // Refresh billing data
                fetchBillingData();
                setOpenMenuId(null);
            } catch (err: any) {
                message.error(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getPaymentStatus = (subscriptionExpiresAt: string | null): 'paid' | 'pending' | 'failed' => {
        if (!subscriptionExpiresAt) return 'failed';
        const now = new Date();
        const expiresAt = new Date(subscriptionExpiresAt);
        
        // If expires in more than 20 days, likely paid
        if (expiresAt.getTime() - now.getTime() > 20 * 24 * 60 * 60 * 1000) {
            return 'paid';
        }
        // If expires in less than 5 days, might be pending renewal
        if (expiresAt.getTime() - now.getTime() < 5 * 24 * 60 * 60 * 1000) {
            return 'pending';
        }
        return 'paid';
    };

    return (
        <AdminLayout>
            <div className="p-6 md:p-8 lg:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Subscriptions & Billing
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Overview of revenue and VIP user management
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleManagePlans}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">tune</span>
                            Manage Plans
                        </button>
                        <button 
                            onClick={handleExportReport}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Monthly Revenue */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ${billingData?.monthlyRevenue.toLocaleString() || '0'}
                                    </span>
                                    <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                        <span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>
                                        {billingData?.monthlyRevenueChange || 0}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">vs. last month</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">payments</span>
                            </div>
                        </div>
                    </div>

                    {/* Active VIP Users */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active VIP Users</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {billingData?.activeVipUsers.toLocaleString() || '0'}
                                    </span>
                                    <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                        <span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>
                                        {billingData?.vipUsersChange || 0}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Active subscriptions</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">star</span>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {billingData?.conversionRate || 0}%
                                    </span>
                                    <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                        <span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>
                                        {billingData?.conversionRateChange || 0}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Free to VIP conversion</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">swap_horiz</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Trend</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Revenue generated from subscriptions over time.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setDateRange('7d')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                        dateRange === '7d'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    7 Days
                                </button>
                                <button
                                    onClick={() => setDateRange('30d')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                        dateRange === '30d'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    30 Days
                                </button>
                                <button
                                    onClick={() => setDateRange('90d')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                        dateRange === '90d'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    90 Days
                                </button>
                                <button
                                    onClick={() => setDateRange('all')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                        dateRange === 'all'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    All Time
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-64">
                        {chartLoading ? (
                            <div className="w-full h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Loading chart data...</span>
                                </div>
                            </div>
                        ) : revenueTrend && revenueTrend.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#6b7280"
                                        className="dark:stroke-gray-400"
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getMonth() + 1}/${date.getDate()}`;
                                        }}
                                    />
                                    <YAxis 
                                        stroke="#6b7280"
                                        className="dark:stroke-gray-400"
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                        labelFormatter={(value) => {
                                            return new Date(value).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            });
                                        }}
                                        formatter={(value: number | undefined) => {
                                            const revenue = value ?? 0;
                                            return [`$${revenue.toFixed(2)}`, 'Revenue'];
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                No revenue data available for the selected period
                            </div>
                        )}
                    </div>
                </div>

                {/* VIP Subscribers Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">VIP Subscribers</h3>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 material-symbols-outlined text-base">
                                    search
                                </span>
                                <input
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Search by name or email..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative" data-filter-container>
                                <button 
                                    onClick={() => {
                                        if (!showFilters) {
                                            // Reset temp filter to current filter when opening
                                            setTempPlanTypeFilter(planTypeFilter);
                                        }
                                        setShowFilters(!showFilters);
                                    }}
                                    className={`px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                        planTypeFilter !== 'all' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">filter_list</span>
                                </button>
                                
                                {/* Filter Dropdown */}
                                {showFilters && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Plan Type
                                                </label>
                                                <select
                                                    value={tempPlanTypeFilter}
                                                    onChange={(e) => setTempPlanTypeFilter(e.target.value as PlanTypeFilter)}
                                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                >
                                                    <option value="all">All Plans</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>
                                            
                                            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <button
                                                    onClick={() => {
                                                        setTempPlanTypeFilter('all');
                                                    }}
                                                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setPlanTypeFilter(tempPlanTypeFilter);
                                                        setShowFilters(false);
                                                    }}
                                                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Plan Type</th>
                                    <th className="px-6 py-4">Start Date</th>
                                    <th className="px-6 py-4">End Date</th>
                                    <th className="px-6 py-4">Payment Status</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                                            Loading subscribers...
                                        </td>
                                    </tr>
                                ) : vipSubscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                                            No VIP subscribers found
                                        </td>
                                    </tr>
                                ) : (
                                    vipSubscribers.map((subscriber) => {
                                        const avatarUrl = subscriber.avatarUrl ? getAvatarUrl(subscriber.avatarUrl) : null;
                                        const initials = getUserInitials(subscriber.name, subscriber.email);
                                        const paymentStatus = getPaymentStatus(subscriber.subscriptionExpiresAt);
                                        const startDate = formatDate(subscriber.subscriptionStartDate);
                                        const expiresAt = formatDate(subscriber.subscriptionExpiresAt);

                                        return (
                                            <tr
                                                key={subscriber.id}
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {avatarUrl ? (
                                                            <img
                                                                alt={subscriber.name || subscriber.email}
                                                                className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                                                src={avatarUrl}
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold ring-2 ring-white dark:ring-gray-800">
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {subscriber.name || subscriber.email}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {subscriber.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900 dark:text-white">VIP Plan</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {subscriber.planType === 'yearly' ? 'Yearly' : 'Monthly'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{startDate}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{expiresAt}</td>
                                                <td className="px-6 py-4">
                                                    {paymentStatus === 'paid' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                                            Paid
                                                        </span>
                                                    ) : paymentStatus === 'pending' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                                                            Failed
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="relative" data-user-menu={subscriber.id}>
                                                        <button 
                                                            onClick={() => setOpenMenuId(openMenuId === subscriber.id ? null : subscriber.id)}
                                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">more_vert</span>
                                                        </button>
                                                        
                                                        {openMenuId === subscriber.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                                                <button
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                                                    onClick={() => {
                                                                        navigate(`/admin/users/${subscriber.id}`);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                >
                                                                    <span className="material-symbols-outlined text-base">visibility</span>
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                                                    onClick={() => handleDeleteUser(subscriber.id, subscriber.name || subscriber.email)}
                                                                >
                                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                                    Delete User
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSubscriptions;

