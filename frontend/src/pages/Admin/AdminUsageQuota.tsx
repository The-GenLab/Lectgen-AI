import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getGlobalStats, getUsageLogs, getAllUsers } from '../../api/admin';
import { getAvatarUrl } from '../../utils/file';
import type { GlobalStats, UsageLog, UserWithStats } from '../../api/admin';

const AdminUsageQuota = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Recent generations (usage logs)
    const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [usersMap, setUsersMap] = useState<Record<string, UserWithStats>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDebounce, setSearchDebounce] = useState<number | null>(null);
    const [exporting, setExporting] = useState(false);

    // Date range filter options: this_month, last_month, last_30_days, ytd
    const [rangeOption, setRangeOption] = useState<'this_month' | 'last_month' | 'last_30_days' | 'ytd'>('this_month');

    const computeRange = (opt: string) => {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        if (opt === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (opt === 'last_30_days') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            end = now;
        } else if (opt === 'ytd') {
            start = new Date(now.getFullYear(), 0, 1);
            end = now;
        } else { // this_month
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
        }

        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    useEffect(() => {
        const { startDate, endDate } = computeRange(rangeOption);
        fetchStats(startDate, endDate);
        fetchUsageLogsAndUsers(startDate, endDate);
    }, []);

    const fetchStats = async (startDate?: string, endDate?: string) => {
        try {
            setLoading(true);
            setError(null);
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const data = await getGlobalStats(params);
            setStats(data);
        } catch (err: any) {
            console.error('Fetch stats error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch stats';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Fetch recent usage logs and a map of users for display
    const fetchUsageLogsAndUsers = async (startDate?: string, endDate?: string) => {
        try {
            setLogsLoading(true);
            // fetch recent logs (limit 50)
            const params: any = { limit: 50, sortBy: 'createdAt', order: 'DESC' };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const { rows } = await getUsageLogs(params);
            setUsageLogs(rows as UsageLog[]);

            // fetch users (reasonable limit) to map userId -> name/avatar
            const { users } = await getAllUsers({ limit: 500 });
            const map: Record<string, UserWithStats> = {};
            users.forEach(u => { map[u.id] = u; });
            setUsersMap(map);
        } catch (err: any) {
            console.error('Fetch logs/users error:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    // server search for logs (debounced caller)
    const fetchSearchLogs = async (q: string) => {
        try {
            setLogsLoading(true);
            const { startDate, endDate } = computeRange(rangeOption);
            const params: any = { q, limit: 50, sortBy: 'createdAt', order: 'DESC' };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const { rows } = await getUsageLogs(params);
            setUsageLogs(rows as UsageLog[]);
        } catch (err: any) {
            console.error('Search logs error:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    // clear debounce on unmount
    useEffect(() => {
        return () => {
            if (searchDebounce) window.clearTimeout(searchDebounce);
        };
    }, [searchDebounce]);

    // re-fetch data whenever the date range option changes
    useEffect(() => {
        const { startDate, endDate } = computeRange(rangeOption);
        fetchStats(startDate, endDate);
        fetchUsageLogsAndUsers(startDate, endDate);
    }, [rangeOption]);
    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border-4 border-primary animate-spin" />
                        <div className="text-sm text-text-sub-light">Loading usage data...</div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
                        <h3 className="text-lg font-semibold mb-2">Error loading data</h3>
                        <p className="text-sm text-text-sub-light mb-4">{error}</p>
                        <button onClick={() => { const { startDate, endDate } = computeRange(rangeOption); fetchStats(startDate, endDate); }} className="px-3 py-2 bg-primary text-white rounded">Retry</button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // small helpers
    const formatTokens = (v?: number) => {
        if (!v) return '0';
        return v > 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;
    };

    const renderChangeBadge = (v?: number) => {
        const val = v ?? 0;
        const absVal = Math.abs(Number(val));
        if (val > 0) {
            return (<span className="text-green-600 dark:text-green-400 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-[14px]">trending_up</span> {absVal}%</span>);
        } else if (val < 0) {
            return (<span className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-[14px]">trending_down</span> {absVal}%</span>);
        } else {
            return (<span className="text-text-sub-light dark:text-text-sub-dark text-xs font-bold">0%</span>);
        }
    };

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dateStr = nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const daysUntil = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <AdminLayout>
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <header className="px-8 pt-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-3xl font-black tracking-tight text-text-main-light dark:text-white">Usage &amp; Quota Overview</h2>
                            <p className="text-text-sub-light dark:text-text-sub-dark text-base">Monitor system-wide AI resource consumption and user quotas.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-text-sub-light dark:text-text-sub-dark text-[20px]">calendar_today</span>
                                <select value={rangeOption} onChange={(e) => setRangeOption(e.target.value as any)} className="pl-10 pr-8 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-medium text-text-main-light dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="this_month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="last_30_days">Last 30 Days</option>
                                    <option value="ytd">Year to Date</option>
                                </select>
                            </div>
                            <button
                                onClick={async () => {
                                    // Export current stats + recent usage logs to CSV
                                    try {
                                        setExporting(true);
                                        // Prepare CSV rows
                                        const header = ['Section', 'Key', 'Value'];
                                        const rows: string[][] = [];

                                        // Stats summary
                                        rows.push(['Stats', 'Total Tokens', String(stats?.totalTokens ?? 0)]);
                                        rows.push(['Stats', 'Active Free Users', String(stats?.activeUsersByRole?.FREE ?? stats?.usersByRole?.FREE ?? 0)]);
                                        rows.push(['Stats', 'Active VIP Users', String(stats?.activeUsersByRole?.VIP ?? stats?.usersByRole?.VIP ?? 0)]);

                                        // Quota watch
                                        rows.push(['Quota Watch', 'Header', '']);
                                        (stats?.quotaStatus || []).forEach((q) => {
                                            rows.push(['Quota Watch', q.userName, `${q.usagePercent}%`]);
                                        });

                                        // Recent logs
                                        rows.push(['Recent Generations', 'Header', '']);
                                        (usageLogs || []).forEach((log) => {
                                            const user = usersMap[log.userId];
                                            const name = user?.name || log.userId;
                                            rows.push(['Recent Generations', 'User', name]);
                                            rows.push(['Recent Generations', 'Role', user?.role || '—']);
                                            rows.push(['Recent Generations', 'Action', log.actionType]);
                                            rows.push(['Recent Generations', 'Tokens', String(log.tokensUsed ?? 0)]);
                                            rows.push(['Recent Generations', 'Date', new Date(log.createdAt).toISOString()]);
                                            rows.push(['Recent Generations', 'Status', log.status]);
                                            rows.push(['Recent Generations', '', '']);
                                        });

                                        // Build CSV string
                                        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
                                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        const rangeLabel = rangeOption.replace(/_/g, '-');
                                        a.download = `lectgen-admin-report-${rangeLabel}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(url);
                                    } catch (e) {
                                        console.error('Export error', e);
                                        alert('Failed to export report');
                                    } finally {
                                        setExporting(false);
                                    }
                                }}
                                className={`flex items-center gap-2 ${exporting ? 'opacity-60 cursor-wait' : 'bg-primary hover:bg-blue-600'} text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors`}>
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                {exporting ? 'Exporting...' : 'Export Report'}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-8 flex flex-col gap-6 max-w-[1400px]">
                    {/* KPI Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium">Next Quota Reset</p>
                                <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-[20px]">update</span>
                            </div>
                            <p className="text-2xl font-bold text-text-main-light dark:text-white">{dateStr}</p>
                            <p className="text-xs text-text-sub-light dark:text-text-sub-dark mt-1">Global monthly reset in {daysUntil} days</p>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium">Total Tokens</p>
                                <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-1.5 rounded-lg text-[20px]">token</span>
                            </div>
                            <p className="text-2xl font-bold text-text-main-light dark:text-white">{formatTokens(stats?.totalTokens)}</p>
                            <div className="flex items-center gap-1 mt-1">
                                {renderChangeBadge(stats?.comparison?.tokenChange)}
                                <span className="text-text-sub-light dark:text-text-sub-dark text-xs">vs last month</span>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium">Active Free Users</p>
                                <span className="material-symbols-outlined text-orange-500 bg-orange-500/10 p-1.5 rounded-lg text-[20px]">person</span>
                            </div>
                            <p className="text-2xl font-bold text-text-main-light dark:text-white">{stats?.activeUsersByRole?.FREE ?? stats?.usersByRole?.FREE ?? 0}</p>
                            <div className="flex items-center gap-1 mt-1">
                                {renderChangeBadge(stats?.comparison?.freeUserGrowth)}
                                <span className="text-text-sub-light dark:text-text-sub-dark text-xs">new signups</span>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 bg-gradient-to-br from-yellow-400/20 to-transparent w-24 h-24 rounded-full blur-xl group-hover:bg-yellow-400/30 transition-all"></div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <p className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium">Active VIP Users</p>
                                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 p-1.5 rounded-lg text-[20px]">diamond</span>
                            </div>
                            <p className="text-2xl font-bold text-text-main-light dark:text-white relative z-10">{stats?.usersByRole?.VIP ?? 0}</p>
                            <div className="flex items-center gap-1 mt-1 relative z-10">
                                {renderChangeBadge(stats?.comparison?.vipRetention)}
                                <span className="text-text-sub-light dark:text-text-sub-dark text-xs">retention rate high</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-text-main-light dark:text-white">Usage by Input Type</h3>
                                <div className="flex gap-2">
                                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">Tokens</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-8 h-48 items-end px-4">
                                {/* Always show Text, Voice, Template columns with default 0 values */}
                                {(() => {
                                    const byAction = stats?.byActionType || {};
                                    const text = (byAction['AI_GENERATION'] || byAction['TEXT_GENERATION'] || 0);
                                    const voice = (byAction['SPEECH_TO_TEXT'] || byAction['VOICE_INPUT'] || 0);
                                    const template = Object.entries(byAction).filter(([k]) => {
                                        const a = k.toLowerCase();
                                        return a.includes('template') || a.includes('pdf') || a.includes('url') || a.includes('template');
                                    }).reduce((s, [, v]) => s + v, 0);

                                    const max = Math.max(1, text, voice, template);

                                    const cols = [
                                        { key: 'text', label: 'Text-to-Slide', value: text, color: 'bg-primary/80 dark:bg-primary' },
                                        { key: 'voice', label: 'Voice Input', value: voice, color: 'bg-sky-400 dark:bg-sky-500' },
                                        { key: 'template', label: 'Template', value: template, color: 'bg-indigo-300 dark:bg-indigo-400' },
                                    ];

                                    return cols.map((c) => (
                                        <div key={c.key} className="flex flex-col items-center gap-2 group h-full justify-end">
                                            <div className="w-full max-w-[80px] rounded-t-md relative hover:opacity-90 transition-all" style={{ height: `${Math.round((c.value / max) * 100)}%` }}>
                                                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity`}>{c.value}</div>
                                                <div className={`${c.color} h-full w-full rounded-t-md`} />
                                            </div>
                                            <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark">{c.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-white mb-4">Usage by Role</h3>
                            <div className="flex-1 flex flex-col justify-center gap-4">
                                {(() => {
                                    const counts = {
                                        FREE: stats?.activeUsersByRole?.FREE ?? stats?.usersByRole?.FREE ?? 0,
                                        VIP: stats?.activeUsersByRole?.VIP ?? stats?.usersByRole?.VIP ?? 0,
                                        ADMIN: stats?.activeUsersByRole?.ADMIN ?? stats?.usersByRole?.ADMIN ?? 0,
                                    };
                                    const total = Math.max(1, counts.FREE + counts.VIP + counts.ADMIN);
                                    const freePct = Math.round((counts.FREE / total) * 100);
                                    const vipPct = Math.round((counts.VIP / total) * 100);
                                    const adminPct = Math.round((counts.ADMIN / total) * 100);

                                    return (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 text-sm font-medium text-text-sub-light dark:text-text-sub-dark">Free Users</div>
                                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${freePct}%` }} />
                                                </div>
                                                <div className="text-xs font-bold w-10 text-right">{freePct}%</div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-24 text-sm font-medium text-text-sub-light dark:text-text-sub-dark">VIP Users</div>
                                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-sky-400 rounded-full" style={{ width: `${vipPct}%` }} />
                                                </div>
                                                <div className="text-xs font-bold w-10 text-right">{vipPct}%</div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-24 text-sm font-medium text-text-sub-light dark:text-text-sub-dark">Admin</div>
                                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-300 rounded-full" style={{ width: `${adminPct}%` }} />
                                                </div>
                                                <div className="text-xs font-bold w-10 text-right">{adminPct}%</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Quota Watch & VIP Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold text-text-main-light dark:text-white">Free Tier Quota Watch</h3>
                                    <p className="text-xs text-text-sub-light dark:text-text-sub-dark">Users nearing monthly limits (&gt;75%)</p>
                                </div>
                                <button onClick={() => navigate('/admin/users')} className="text-primary text-sm font-medium hover:underline">View All</button>
                            </div>
                            <div className="p-0">
                                {stats?.quotaStatus && stats.quotaStatus.length > 0 ? (
                                    stats.quotaStatus.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="size-8 rounded-full bg-slate-200 bg-center bg-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between mb-1">
                                                    <p className="text-sm font-medium text-text-main-light dark:text-white truncate">{item.userName}</p>
                                                    <p className={`text-xs font-bold ${item.usagePercent >= 90 ? 'text-red-500' : item.usagePercent >= 80 ? 'text-orange-500' : 'text-yellow-500'}`}>{item.usagePercent}%</p>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`${item.usagePercent >= 90 ? 'bg-red-500' : item.usagePercent >= 80 ? 'bg-orange-500' : 'bg-yellow-500'} h-full`} style={{ width: `${item.usagePercent}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-center items-center p-6 text-text-sub-light">No quota data available</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#136dec] to-[#0a4abf] rounded-xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-yellow-300">workspace_premium</span>
                                    </div>
                                    <h3 className="text-xl font-bold">VIP Status Overview</h3>
                                </div>
                                <p className="text-blue-100 text-sm mb-6 max-w-[90%]">VIP users have unlimited generation access. Monitor system load to ensure premium performance.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                        <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">System Load</p>
                                        <p className="text-xl font-bold flex items-center gap-2">
                                            <span>{stats?.vipMetrics ? (stats.vipMetrics.systemLoad < 60 ? 'Normal' : stats.vipMetrics.systemLoad < 80 ? 'Moderate' : 'High') : 'N/A'}</span>
                                            <span className={`size-2 ${stats?.vipMetrics && stats.vipMetrics.systemLoad < 60 ? 'bg-green-400' : stats?.vipMetrics && stats.vipMetrics.systemLoad < 80 ? 'bg-yellow-400' : 'bg-red-400'} rounded-full`} />
                                        </p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                        <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Priority Queue</p>
                                        <p className="text-xl font-bold">{stats?.vipMetrics?.avgResponseTime ?? 0}ms Delay</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-center relative z-10">
                                <span className="text-sm font-medium text-blue-100">{stats?.vipMetrics?.activeVipUsers ?? 0} Active VIPs</span>
                                <button  onClick={() => navigate('/admin/settings')} className="px-4 py-2 bg-white text-primary text-sm font-bold rounded-lg shadow hover:bg-blue-50 transition-colors">Manage Tiers</button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Generations Table (kept as static sample rows like the design) */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border-light dark:border-border-dark flex flex-wrap gap-4 justify-between items-center">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-white">Recent Generations</h3>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-text-sub-light text-[18px]">search</span>
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setSearchQuery(v);
                                            // simple debounce for client-side filtering
                                            if (searchDebounce) window.clearTimeout(searchDebounce);
                                            const t = window.setTimeout(() => {
                                                // perform server-side search by query
                                                if (v && v.length > 0) {
                                                    fetchSearchLogs(v);
                                                } else {
                                                    // empty -> reload recent logs
                                                    fetchUsageLogsAndUsers();
                                                }
                                            }, 250);
                                            setSearchDebounce(t);
                                        }}
                                        className="pl-9 pr-4 py-2 bg-background-light dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48"
                                        placeholder="Search user or id..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-sub-light dark:text-text-sub-dark uppercase bg-background-light dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">User</th>
                                        <th className="px-6 py-3 font-medium">Role</th>
                                        <th className="px-6 py-3 font-medium">Input Type</th>
                                        <th className="px-6 py-3 font-medium">Tokens Used</th>
                                        <th className="px-6 py-3 font-medium">Date &amp; Time</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {logsLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-text-sub-light">Loading recent generations...</td>
                                        </tr>
                                    ) : (
                                        (usageLogs || [])
                                            .filter((log) => {
                                                if (!searchQuery) return true;
                                                const q = searchQuery.toLowerCase();
                                                const user = usersMap[log.userId];
                                                const userName = user?.name?.toLowerCase() || '';
                                                const action = (log.actionType || '').toLowerCase();
                                                const status = (log.status || '').toLowerCase();
                                                const id = (log.id || '').toLowerCase();
                                                return (
                                                    userName.includes(q) ||
                                                    action.includes(q) ||
                                                    status.includes(q) ||
                                                    id.includes(q) ||
                                                    String(log.tokensUsed || '').includes(q)
                                                );
                                            })
                                            .map((log) => {
                                                const user = usersMap[log.userId];
                                                const name = user?.name || log.userId;
                                                const avatarUrl = user?.avatarUrl ? getAvatarUrl(user.avatarUrl) : null;
                                                const role = user?.role || '—';
                                                const userInitials = name ? (name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) : 'U';

                                                const formattedDate = new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                                                const statusBadge = () => {
                                                    if (log.level === 'info') return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                                    if (log.level === 'warning') return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                                                    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                                                };

                                                return (
                                                    <tr key={log.id} className="bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-text-main-light dark:text-white">
                                                            <div className="flex items-center gap-3">
                                                                {avatarUrl ? (
                                                                    <div 
                                                                        className="size-8 rounded-full bg-slate-200 bg-cover bg-center" 
                                                                        style={{ backgroundImage: `url(${avatarUrl})` }}
                                                                    />
                                                                ) : (
                                                                    <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                        {userInitials}
                                                                    </div>
                                                                )}
                                                                <span>{name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-text-sub-light dark:text-text-sub-dark">{role}</td>
                                                        <td className="px-6 py-4 text-text-main-light dark:text-white">{log.actionType?.replace('_', '-')}</td>
                                                        <td className="px-6 py-4 font-mono text-text-main-light dark:text-white">{(log.tokensUsed || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-text-sub-light dark:text-text-sub-dark">{formattedDate}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={statusBadge()}>{log.status}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-center py-6 text-sm text-text-sub-light dark:text-text-sub-dark">© 2024 LectGen-AI. All rights reserved.</div>
                </div>
            </main>
        </AdminLayout>
    );
};

export default AdminUsageQuota;
