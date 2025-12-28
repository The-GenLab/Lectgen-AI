import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, DatePicker, Button } from 'antd';
import { DollarOutlined, UserOutlined, CrownOutlined, ThunderboltOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/AdminLayout';
import { getGlobalStats, getUsageLogs, getAllUsers } from '../../api/admin';
import { getAvatarUrl } from '../../utils/file';
import type { GlobalStats, UserWithStats } from '../../api/admin';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import type { UsageLog } from '../../api/admin';

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<any>(null);
    const [granularity, setGranularity] = useState<'day' | 'month' | 'year'>('day');
    const [timeSeries, setTimeSeries] = useState<any[]>([]);
    const [inputSourceData, setInputSourceData] = useState<any[]>([]);
    const [roleSeries, setRoleSeries] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);
    const [userMap, setUserMap] = useState<Record<string, UserWithStats>>({});
    const navigate = useNavigate();



    useEffect(() => {
        fetchStats();
        fetchRecentLogs();
        fetchUsersMap();
    }, []);

    const fetchStats = async (startDate?: string, endDate?: string) => {
        try {
            setLoading(true);
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const data = await getGlobalStats(params);
            setStats(data);
            // also fetch recent usage logs for timeseries
            await fetchUsageLogsForChart(startDate, endDate, granularity);
        } catch (err) {
            console.error('Failed to load global stats', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageLogsForChart = async (startIso?: string, endIso?: string, gran: 'day' | 'month' | 'year' = 'day') => {
        try {
            const end = endIso ? new Date(endIso) : new Date();
            let start: Date;
            if (startIso) start = new Date(startIso);
            else {
                if (gran === 'day') start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000); // last 7 days
                else start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000); // last 30 days
            }

            const res = await getUsageLogs({ startDate: start.toISOString(), endDate: end.toISOString(), limit: 10000 });
            const rows = res.rows || [];

            const counts: Record<string, number> = {};
            const inputCounts: Record<string, number> = {};

            // initialize buckets
            const cur = new Date(start.getTime());
            while (cur <= end) {
                let key = '';
                if (gran === 'day') key = cur.toISOString().slice(0, 10);
                else if (gran === 'month') key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
                else key = `${cur.getFullYear()}`;
                counts[key] = 0;
                // increment
                if (gran === 'day') cur.setDate(cur.getDate() + 1);
                else if (gran === 'month') cur.setMonth(cur.getMonth() + 1);
                else cur.setFullYear(cur.getFullYear() + 1);
            }

            // Build user role map to aggregate per-role counts per bucket
            const usersResp = await getAllUsers({ limit: 10000 });
            const usersList = usersResp?.users || [] as any[];
            const userRoleMap: Record<string, string> = {};
            usersList.forEach((u: any) => { if (u?.id) userRoleMap[u.id] = u.role; });

            const roleCountsByDate: Record<string, Record<string, number>> = {};
            Object.keys(counts).forEach(k => { roleCountsByDate[k] = { FREE: 0, VIP: 0, ADMIN: 0 }; });

            rows.forEach((r: any) => {
                const d = new Date(r.createdAt);
                let key = '';
                if (gran === 'day') key = d.toISOString().slice(0, 10);
                else if (gran === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                else key = `${d.getFullYear()}`;

                if (counts[key] === undefined) counts[key] = 0;
                counts[key]++;

                const source = r.metadata?.source || r.actionType || 'unknown';
                inputCounts[source] = (inputCounts[source] || 0) + 1;

                const role = userRoleMap[r.userId] || 'FREE';
                if (!roleCountsByDate[key]) roleCountsByDate[key] = { FREE: 0, VIP: 0, ADMIN: 0 };
                roleCountsByDate[key][role] = (roleCountsByDate[key][role] || 0) + 1;
            });

            const series = Object.keys(counts).sort().map(k => ({ date: k, value: counts[k] }));
            setTimeSeries(series);

            const sourceData = Object.entries(inputCounts).map(([name, value]) => ({ name, value }));
            setInputSourceData(sourceData);

            const roleSeries = Object.keys(roleCountsByDate).sort().map(k => ({ date: k, FREE: roleCountsByDate[k].FREE || 0, VIP: roleCountsByDate[k].VIP || 0, ADMIN: roleCountsByDate[k].ADMIN || 0 }));
            setRoleSeries(roleSeries);
        } catch (err) {
            console.error('Failed to load usage logs for chart', err);
        }
    };

    // Recent logs & users map
    const fetchUsersMap = async () => {
        try {
            const usersResp = await getAllUsers({ limit: 10000 });
            const users = usersResp?.users || [];
            const map: Record<string, UserWithStats> = {};
            users.forEach((u: UserWithStats) => {
                if (u?.id) map[u.id] = u;
            });
            setUserMap(map);
        } catch (err) {
            console.error('Failed to load users map', err);
        }
    };

    const fetchRecentLogs = async () => {
        try {
            setRecentLoading(true);
            const res = await getUsageLogs({ limit: 10, sortBy: 'createdAt', order: 'DESC' });
            const rows = res.rows || [];
            setRecentLogs(rows);
        } catch (err) {
            console.error('Failed to load recent logs', err);
        } finally {
            setRecentLoading(false);
        }
    };

    // xuất file csv
    const exportReport = () => {
        const rows: string[] = [];
        rows.push(`Total Users,${stats?.totalUsers || 0}`);
        rows.push(`VIP Users,${stats?.usersByRole?.VIP || 0}`);
        rows.push(`Slides Generated,${stats?.totalCalls || 0}`);
        rows.push(`Revenue,${stats?.totalCost || 0}`);
        rows.push(`Avg Gen Time (ms),${stats?.vipMetrics?.avgResponseTime || 0}`);
        rows.push(`Success Rate (%),${stats?.successRate || 0}`);
        rows.push('');
        rows.push('Date,Value');
        timeSeries.forEach(ts => rows.push(`${ts.date},${ts.value}`));

        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lectgen_dashboard_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    // Prepare small datasets for charts from available stats
    const userDist = stats ? [
        { name: 'Free', value: stats.usersByRole?.FREE || 0 },
        { name: 'VIP', value: stats.usersByRole?.VIP || 0 },
        { name: 'Admin', value: stats.usersByRole?.ADMIN || 0 },
    ] : [];

    const formatXAxis = (value: string) => {
        if (granularity === 'day') return new Date(value).toLocaleDateString(undefined, { weekday: 'short' });
        if (granularity === 'month') return value;
        return value;
    };
    const PIE_COLORS = ['#136dec', '#00C2FF', '#7C5CFF', '#FFBB28', '#FF8042'];
    const inputTotal = inputSourceData.reduce((s: number, x: any) => s + (x?.value || 0), 0);

    const humanize = (s: string) => s ? s.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, t => t.toUpperCase()) : s;

    const renderChangeBadge = (v?: number | string) => {
        const num = Number(v ?? 0);
        const absNum = Math.abs(Math.round(num));
        if (num > 0) return (<span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="material-symbols-outlined text-[14px]">trending_up</span>{absNum}%</span>);
        if (num < 0) return (<span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"><span className="material-symbols-outlined text-[14px]">trending_down</span>{absNum}%</span>);
        return (<span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">0%</span>);
    };

    return (
        <AdminLayout>
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-7xl mx-auto flex flex-col gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">System Overview</h1>
                            <p className="text-sm text-slate-500 mt-1">Monitor system-wide AI resource consumption and user quotas</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                <DatePicker.RangePicker value={range} onChange={(vals) => {
                                    if (!vals) { setRange(null); fetchStats(); return; }
                                    const [s, e]: any = vals;
                                    setRange(vals);
                                    const sIso = s.startOf('day').toISOString();
                                    const eIso = e.endOf('day').toISOString();
                                    fetchStats(sIso, eIso);
                                }} />
                            </div>
                            <Button type="primary" onClick={() => exportReport()}>Export Report</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-blue-50 rounded-lg text-primary"><UserOutlined /></div>
                                {renderChangeBadge(stats?.comparison?.freeUserGrowth)}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Users</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><CrownOutlined /></div>
                                {renderChangeBadge(stats?.comparison?.vipRetention)}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">VIP Users</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.usersByRole?.VIP || 0}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><ThunderboltOutlined /></div>
                                {renderChangeBadge(stats?.comparison?.slidesChange)}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Slides Gen.</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.totalCalls || 0}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarOutlined /></div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stats?.totalCost ? Number(stats.totalCost).toFixed(2) : '0.00'}</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Revenue</p>
                                <h3 className="text-2xl font-bold mt-1">${stats?.totalCost ? Number(stats.totalCost).toFixed(2) : '0.00'}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600"><ClockCircleOutlined /></div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stats?.vipMetrics?.avgResponseTime || 0}ms</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Avg. Gen Time</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.vipMetrics?.avgResponseTime || 0}ms</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><WarningOutlined /></div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{((100 - (stats?.successRate || 0))).toFixed(1)}%</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Error Rate</p>
                                <h3 className="text-2xl font-bold mt-1">{((100 - (stats?.successRate || 0))).toFixed(1)}%</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Slides Generated Over Time</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Comparing daily generation volume</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1 text-xs font-medium rounded-md ${granularity === 'day' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100'}`}
                                        onClick={() => { setGranularity('day'); fetchUsageLogsForChart(range?.[0], range?.[1], 'day'); }}
                                    >
                                        Week
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs font-medium rounded-md ${granularity === 'month' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100'}`}
                                        onClick={() => { setGranularity('month'); fetchUsageLogsForChart(range?.[0], range?.[1], 'month'); }}
                                    >
                                        Month
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs font-medium rounded-md ${granularity === 'year' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100'}`}
                                        onClick={() => { setGranularity('year'); fetchUsageLogsForChart(range?.[0], range?.[1], 'year'); }}
                                    >
                                        Year
                                    </button>
                                </div>
                            </div>

                            <div className="relative h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke="#136dec" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">User Distribution</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Active Free vs VIP Users</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-full">
                                        {roleSeries.length ? (
                                            <div style={{ width: '100%', height: 200 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={roleSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" tickFormatter={formatXAxis} />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="FREE" fill="#cfe9ff" name="Free" />
                                                        <Bar dataKey="VIP" fill="#136dec" name="VIP" />
                                                        <Bar dataKey="ADMIN" fill="#b0b0b0" name="Admin" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-400">No distribution data available</div>
                                        )}

                                        <div className="flex flex-col gap-2 mt-4">
                                            {userDist.map((d, i) => (
                                                <div key={`ud-${i}`} className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                                                    <span className="text-xs font-medium text-slate-600">{d.name} ({d.value})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Input Source</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">How users start generation</p>
                                <div className="flex items-center mt-4" style={{ height: 220 }}>
                                    {inputSourceData && inputSourceData.length ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={inputSourceData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="40%" // Đẩy tâm biểu đồ sang trái một chút
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={10}
                                                    labelLine={false}
                                                >
                                                    {inputSourceData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: any) => [value, 'Total']} />
                                                <Legend
                                                    layout="vertical"
                                                    verticalAlign="middle"
                                                    align="right"
                                                    wrapperStyle={{ paddingLeft: "10px" }}
                                                    formatter={(value, entry: any) => {
                                                        const v = entry?.payload?.value || 0;
                                                        const pct = inputTotal ? Math.round((v / inputTotal) * 100) : 0;
                                                        return (
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {humanize(value)}: <span className="text-slate-400">{v} ({pct}%)</span>
                                                            </span>
                                                        );
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-sm text-slate-400 w-full text-center">No input source data available</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Generation Jobs</h3>
                            <button className="text-sm text-primary font-medium hover:underline" onClick={() => navigate('/admin/logs')}>View All History</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Topic / Input</th>
                                        <th className="px-6 py-4">Slides</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                    {recentLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">Loading recent logs...</td>
                                        </tr>
                                    ) : recentLogs.length ? (
                                        recentLogs.map((r: any) => {
                                            const user = userMap[r.userId];
                                            const userName = user?.name || user?.email || r.userId;
                                            const avatarUrl = user?.avatarUrl ? getAvatarUrl(user.avatarUrl) : null;
                                            const userInitials = userName ? (userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()) : 'U';
                                            
                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {avatarUrl ? (
                                                                <div 
                                                                    className="w-8 h-8 rounded-full bg-slate-200 bg-cover bg-center" 
                                                                    style={{ backgroundImage: `url(${avatarUrl})` }}
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                    {userInitials}
                                                                </div>
                                                            )}
                                                            <span className="font-medium text-slate-900 dark:text-white">{userName}</span>
                                                        </div>
                                                    </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.metadata?.topic || r.metadata?.prompt || r.actionType}</td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{r.metadata?.slideCount ? `${r.metadata.slideCount} Slides` : (r.metadata?.slides ? `${r.metadata.slides} Slides` : '—')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-rose-100 text-rose-800'}`}>
                                                        {r.status === 'SUCCESS' ? 'Completed' : r.status === 'PENDING' ? 'Processing' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">{(function timeAgo(iso: string) {
                                                    const d = new Date(iso);
                                                    const s = Math.floor((Date.now() - d.getTime()) / 1000);
                                                    if (s < 60) return `${s}s ago`;
                                                    if (s < 3600) return `${Math.floor(s / 60)} mins ago`;
                                                    if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
                                                    return `${Math.floor(s / 86400)} days ago`;
                                                })(r.createdAt)}</td>
                                            </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">No recent generation jobs</td>
                                        </tr>
                                    )}
                                    {/* ... other rows ... */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </AdminLayout>
    );
}

