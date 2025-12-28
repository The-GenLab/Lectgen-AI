import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getUserStats, getUsageLogs, updateUserRole, updateUserQuota, resetUserPassword, uploadUserAvatar } from '../../api/admin';
import { getAvatarUrl } from '../../utils/file';
import type { UsageLog } from '../../api/admin';

interface UserDetailData {
    user: {
        id: string;
        email: string;
        name: string;
        avatarUrl?: string | null;
        role: string;
        slidesGenerated: number;
        maxSlidesPerMonth: number;
        subscriptionExpiresAt: string | null;
        createdAt: string;
    };
    stats: {
        totalCalls: number;
        totalTokens: number;
        totalCost: number;
        successRate: number;
    };
}

const AdminUserDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [userData, setUserData] = useState<UserDetailData | null>(null);
    const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (id) {
            fetchUserData();
            fetchRecentLogs();
        }
    }, [id]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const data = await getUserStats(id!);
            setUserData(data);
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentLogs = async () => {
        try {
            const { rows } = await getUsageLogs({
                userId: id,
                limit: 10,
                sortBy: 'createdAt',
                order: 'DESC'
            });
            setRecentLogs(rows);
        } catch (err) {
            console.error('Failed to fetch recent logs:', err);
        }
    };

    const getUserInitials = (name: string, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return email?.[0]?.toUpperCase() || 'U';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const getUsagePercentage = () => {
        if (!userData) return 0;
        if (userData.user.role?.toUpperCase() === 'VIP') return 100; // Unlimited
        if (userData.user.maxSlidesPerMonth === 0) return 0;
        return Math.min(Math.round((userData.user.slidesGenerated / userData.user.maxSlidesPerMonth) * 100), 100);
    };

    const getLastActive = () => {
        if (recentLogs.length === 0) return null;
        const lastLog = recentLogs[0];
        return {
            timeAgo: getTimeAgo(lastLog.createdAt),
            action: lastLog.metadata?.topic || lastLog.metadata?.prompt || lastLog.actionType
        };
    };

    // Calculate input distribution (mock for now, can be enhanced with real data)
    const getInputDistribution = () => {
        const textCount = recentLogs.filter(log => 
            log.actionType === 'TEXT_GENERATION' || log.actionType === 'AI_GENERATION'
        ).length;
        const speechCount = recentLogs.filter(log => 
            log.actionType === 'SPEECH_TO_TEXT'
        ).length;
        const total = recentLogs.length || 1;
        
        return {
            text: Math.round((textCount / total) * 100),
            speech: Math.round((speechCount / total) * 100),
            other: Math.round(((total - textCount - speechCount) / total) * 100)
        };
    };

    if (loading || !userData) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-slate-500">Loading user details...</div>
                </div>
            </AdminLayout>
        );
    }

    const { user } = userData;
    const avatarUrl = user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null;
    const initials = getUserInitials(user.name || '', user.email);
    const usagePercent = getUsagePercentage();
    const lastActive = getLastActive();
    const inputDist = getInputDistribution();
    const isVIP = user.role?.toUpperCase() === 'VIP';
    const isAdmin = user.role?.toUpperCase() === 'ADMIN';

    return (
        <AdminLayout>
            <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white font-display antialiased min-h-screen">
                <div className="p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm">
                            <button 
                                className="text-text-secondary hover:text-primary transition-colors"
                                onClick={() => navigate('/admin')}
                            >
                                Dashboard
                            </button>
                            <span className="text-text-secondary">/</span>
                            <button 
                                className="text-text-secondary hover:text-primary transition-colors"
                                onClick={() => navigate('/admin/users')}
                            >
                                Users
                            </button>
                            <span className="text-text-secondary">/</span>
                            <span className="text-text-main dark:text-white font-medium">{user.name || user.email}</span>
                        </div>

                        {/* Page Heading */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white tracking-tight">
                                    User Details
                                </h2>
                                <p className="text-text-secondary text-sm mt-1">
                                    Manage user profile, subscription, and system permissions.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-medium text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                    Back to List
                                </button>
                                <button 
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm shadow-primary/30"
                                    onClick={() => {
                                        // TODO: Implement save changes
                                        alert('Save changes functionality coming soon');
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Profile Card */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Identity Card */}
                                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        {avatarUrl ? (
                                            <div 
                                                className="size-28 rounded-full bg-cover bg-center border-4 border-background-light dark:border-slate-700 shadow-inner"
                                                style={{ backgroundImage: `url(${avatarUrl})` }}
                                            />
                                        ) : (
                                            <div className="size-28 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-4 border-background-light dark:border-slate-700 shadow-inner text-3xl font-bold text-slate-500 dark:text-slate-400">
                                                {initials}
                                            </div>
                                        )}
                                        <span className="absolute bottom-1 right-1 size-5 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full" title="Online"></span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main dark:text-white">{user.name || user.email}</h3>
                                    <p className="text-text-secondary text-sm mb-4">{user.email}</p>
                                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                                        {isVIP && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                                                PRO PLAN
                                            </span>
                                        )}
                                        {isAdmin && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
                                                ADMIN
                                            </span>
                                        )}
                                        {!isVIP && !isAdmin && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                                                FREE PLAN
                                            </span>
                                        )}
                                        <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-200 dark:border-green-800">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <div className="w-full grid grid-cols-2 gap-4 py-4 border-t border-b border-border-light dark:border-border-dark mb-6">
                                        <div className="text-center">
                                            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">User ID</p>
                                            <p className="text-sm font-semibold text-text-main dark:text-white mt-0.5">
                                                #{user.id.slice(0, 8).toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Joined</p>
                                            <p className="text-sm font-semibold text-text-main dark:text-white mt-0.5">
                                                {formatDate(user.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full space-y-3">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file && id) {
                                                    try {
                                                        setUploadingAvatar(true);
                                                        await uploadUserAvatar(id, file);
                                                        await fetchUserData();
                                                        alert('Avatar updated successfully');
                                                    } catch (err) {
                                                        alert('Failed to upload avatar');
                                                    } finally {
                                                        setUploadingAvatar(false);
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = '';
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                        <button 
                                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-background-light dark:bg-slate-800 text-text-main dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                            {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                                        </button>
                                        <button 
                                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-background-light dark:bg-slate-800 text-text-main dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                            onClick={() => setShowResetPasswordModal(true)}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                                            Reset Password
                                        </button>
                                        <button 
                                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-background-light dark:bg-slate-800 text-text-main dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                            onClick={() => {
                                                window.location.href = `mailto:${user.email}`;
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                            Email User
                                        </button>
                                    </div>
                                </div>

                                {/* Subscription Management */}
                                {!isAdmin && (
                                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
                                        <h4 className="text-base font-bold text-text-main dark:text-white mb-4">Subscription</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-text-secondary">Current Plan</span>
                                                    <span className="font-medium text-text-main dark:text-white">
                                                        {isVIP ? 'Pro Monthly ($29/mo)' : 'Free Tier'}
                                                    </span>
                                                </div>
                                                {user.subscriptionExpiresAt && (
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-text-secondary">Next Billing</span>
                                                        <span className="font-medium text-text-main dark:text-white">
                                                            {formatDate(user.subscriptionExpiresAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Change Plan</label>
                                                <select 
                                                    className="w-full bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm text-text-main dark:text-white focus:ring-2 focus:ring-primary"
                                                    value={user.role}
                                                    onChange={(e) => {
                                                        // TODO: Implement change plan
                                                        alert('Change plan functionality coming soon');
                                                    }}
                                                >
                                                    <option value="FREE">Free Tier</option>
                                                    <option value="VIP">Pro Monthly</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button 
                                                    className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors"
                                                    onClick={() => {
                                                        if (!isVIP) {
                                                            updateUserRole(user.id, 'VIP').then(() => {
                                                                fetchUserData();
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Upgrade
                                                </button>
                                                <button 
                                                    className="flex-1 px-3 py-2 bg-background-light dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-secondary text-sm font-medium rounded-lg transition-colors"
                                                    onClick={() => {
                                                        if (isVIP) {
                                                            updateUserRole(user.id, 'FREE').then(() => {
                                                                fetchUserData();
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Downgrade
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Danger Zone */}
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6">
                                    <h4 className="text-base font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h4>
                                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-4">
                                        Actions here can affect the user's access permanently.
                                    </p>
                                    <div className="space-y-3">
                                        <button 
                                            className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            onClick={() => {
                                                // TODO: Implement ban user
                                                alert('Ban user functionality coming soon');
                                            }}
                                        >
                                            <span>Ban User</span>
                                            <span className="material-symbols-outlined text-[18px]">block</span>
                                        </button>
                                        <button 
                                            className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            onClick={async () => {
                                                if (confirm('Reset monthly quota for this user?')) {
                                                    try {
                                                        await updateUserQuota(user.id, user.maxSlidesPerMonth);
                                                        fetchUserData();
                                                    } catch (err) {
                                                        alert('Failed to reset quota');
                                                    }
                                                }
                                            }}
                                        >
                                            <span>Reset Monthly Quota</span>
                                            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Stats & Activity */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-primary">
                                                <span className="material-symbols-outlined">slideshow</span>
                                            </div>
                                            <span className="text-sm font-medium text-text-secondary">Slides Generated</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold text-text-main dark:text-white">
                                                {user.slidesGenerated.toLocaleString()}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-text-secondary mt-1">Total since registration</p>
                                    </div>
                                    <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                                <span className="material-symbols-outlined">bolt</span>
                                            </div>
                                            <span className="text-sm font-medium text-text-secondary">Credits Remaining</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold text-text-main dark:text-white">
                                                {isVIP ? '∞' : user.maxSlidesPerMonth - user.slidesGenerated}
                                            </h3>
                                            {!isVIP && (
                                                <span className="text-xs font-medium text-text-secondary">/ {user.maxSlidesPerMonth}</span>
                                            )}
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${usagePercent}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                                <span className="material-symbols-outlined">schedule</span>
                                            </div>
                                            <span className="text-sm font-medium text-text-secondary">Last Active</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold text-text-main dark:text-white">
                                                {lastActive ? lastActive.timeAgo : '—'}
                                            </h3>
                                            {lastActive && <span className="text-xs text-text-secondary">ago</span>}
                                        </div>
                                        {lastActive && (
                                            <p className="text-xs text-text-secondary mt-1">
                                                Generated "{lastActive.action}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Usage Distribution */}
                                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
                                    <h4 className="text-lg font-bold text-text-main dark:text-white mb-6">Input Usage Distribution</h4>
                                    <div className="space-y-5">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-text-secondary text-[20px]">description</span>
                                                    <span className="text-sm font-medium text-text-main dark:text-white">Text to Slide</span>
                                                </div>
                                                <span className="text-sm font-bold text-text-main dark:text-white">{inputDist.text}%</span>
                                            </div>
                                            <div className="w-full bg-background-light dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div className="bg-primary h-full rounded-full" style={{ width: `${inputDist.text}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-text-secondary text-[20px]">mic</span>
                                                    <span className="text-sm font-medium text-text-main dark:text-white">Speech to Text</span>
                                                </div>
                                                <span className="text-sm font-bold text-text-main dark:text-white">{inputDist.speech}%</span>
                                            </div>
                                            <div className="w-full bg-background-light dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${inputDist.speech}%` }}></div>
                                            </div>
                                        </div>
                                        {inputDist.other > 0 && (
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-text-secondary text-[20px]">image</span>
                                                        <span className="text-sm font-medium text-text-main dark:text-white">Other</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-text-main dark:text-white">{inputDist.other}%</span>
                                                </div>
                                                <div className="w-full bg-background-light dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${inputDist.other}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity Log */}
                                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                                        <h4 className="text-lg font-bold text-text-main dark:text-white">Recent Generations</h4>
                                        <button 
                                            className="text-sm text-primary font-medium hover:underline"
                                            onClick={() => navigate(`/admin/logs?userId=${user.id}`)}
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-background-light dark:bg-slate-800 text-text-secondary uppercase text-xs font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Project Name</th>
                                                    <th className="px-6 py-3">Type</th>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3">Credits</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                                {recentLogs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                                                            No recent generations
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    recentLogs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-text-main dark:text-white">
                                                                {log.metadata?.topic || log.metadata?.prompt || log.actionType || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-text-secondary">
                                                                {log.actionType?.replace(/_/g, ' ') || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-text-secondary">
                                                                {formatDateTime(log.createdAt)}
                                                            </td>
                                                            <td className="px-6 py-4 text-text-secondary">
                                                                {log.tokensUsed ? `-${log.tokensUsed}` : '0'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    log.status === 'SUCCESS' 
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                    {log.status === 'SUCCESS' ? 'Success' : 'Failed'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reset Password Modal */}
                {showResetPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Reset Password</h3>
                            <p className="text-sm text-text-secondary mb-4">
                                Enter a new password for {user.email}. Password must be at least 12 characters.
                            </p>
                            <input
                                type="password"
                                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-slate-700 text-text-main dark:text-white mb-4"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main transition-colors"
                                    onClick={() => {
                                        setShowResetPasswordModal(false);
                                        setNewPassword('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                                    disabled={resetPasswordLoading || newPassword.length < 12}
                                    onClick={async () => {
                                        if (newPassword.length < 12) {
                                            alert('Password must be at least 12 characters');
                                            return;
                                        }
                                        try {
                                            setResetPasswordLoading(true);
                                            await resetUserPassword(id!, newPassword);
                                            alert('Password reset successfully');
                                            setShowResetPasswordModal(false);
                                            setNewPassword('');
                                        } catch (err: any) {
                                            alert(err.response?.data?.message || 'Failed to reset password');
                                        } finally {
                                            setResetPasswordLoading(false);
                                        }
                                    }}
                                >
                                    {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminUserDetail;

