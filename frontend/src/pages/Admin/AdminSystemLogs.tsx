import { useEffect, useState, useRef, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getUsageLogs } from '../../api/admin';
import dayjs from 'dayjs';

export default function AdminSystemLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState<string | null>(null);
    const [service, setService] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<any>(null); // [Date, Date]
    const [rangeOption, setRangeOption] = useState<'last_24h' | 'last_7d' | 'last_30d' | 'this_month'>('last_24h');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [total, setTotal] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [sortField, setSortField] = useState<string | null>('createdAt');
    const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('descend');

    const fetchCounterRef = useRef(0);
    const serviceColorMapRef = useRef<Map<string, string>>(new Map());
    const colorPalette = ['#60a5fa', '#34d399', '#f97316', '#a78bfa', '#f472b6', '#f59e0b', '#ef4444'];

    const computeRange = (opt: string) => {
        const now = dayjs();
        let start = now.subtract(24, 'hour');
        let end = now;
        if (opt === 'last_7d') {
            start = now.subtract(7, 'day');
        } else if (opt === 'last_30d') {
            start = now.subtract(30, 'day');
        } else if (opt === 'this_month') {
            start = now.startOf('month');
        }
        return [start.toDate(), end.toDate()];
    };

    // ensure timeRange is set when rangeOption changes
    useEffect(() => {
        setTimeRange(computeRange(rangeOption));
    }, [rangeOption]);

    const fetchLogs = useCallback(async (opts?: { offset?: number; limit?: number }) => {
        const fetchId = ++fetchCounterRef.current;
        try {
            setLoading(true);

            const params: any = { limit: opts?.limit ?? pageSize, offset: opts?.offset ?? (page - 1) * pageSize };
            if (timeRange) {
                params.startDate = dayjs(timeRange[0]).startOf('day').toISOString();
                params.endDate = dayjs(timeRange[1]).endOf('day').toISOString();
            }
            if (service) params.actionType = service;
            if (level) {
                params.status = level;
            }
            const trimmedQuery = typeof query === 'string' ? query.trim() : query;
            if (trimmedQuery) params.q = trimmedQuery;
            if (sortField) params.sortBy = sortField;
            if (sortOrder) params.order = sortOrder === 'descend' ? 'DESC' : 'ASC';

            // debug
            console.debug('fetchLogs params', params);

            const res = await getUsageLogs(params as any);
            if (fetchId !== fetchCounterRef.current) return; // stale response

            setLogs(res.rows || []);
            setTotal(res.count ?? (res.rows || []).length);
            setLastUpdated(new Date());

            // assign colors to services discovered
            const servicesList = Array.from(new Set((res.rows || []).map((r: any) => r.actionType || r.metadata?.service).filter(Boolean)));
            servicesList.forEach((s: string) => {
                if (!serviceColorMapRef.current.has(s)) {
                    serviceColorMapRef.current.set(s, colorPalette[serviceColorMapRef.current.size % colorPalette.length]);
                }
            });
        } catch (err: any) {
            if (fetchId !== fetchCounterRef.current) return;
            console.error('Failed to load logs', err);
            const serverMsg = err?.response?.data?.message || err?.message || 'Failed to load logs';
            // show user-friendly alert
            window.alert(serverMsg);
        } finally {
            if (fetchId === fetchCounterRef.current) setLoading(false);
        }
    }, [page, pageSize, timeRange, service, level, query, sortField, sortOrder]);

    // Reset to page 1 and fetch when any filter/sort changes
    useEffect(() => {
        setPage(1);
        fetchLogs({ offset: 0, limit: pageSize });
    }, [level, service, timeRange, query, pageSize, sortField, sortOrder]);

    // Fetch when page/pageSize changes
    useEffect(() => {
        fetchLogs({ offset: (page - 1) * pageSize, limit: pageSize });
    }, [page, pageSize, fetchLogs]);

    const onRefresh = () => fetchLogs({ offset: 0, limit: pageSize });

    const onExport = () => {
        try {
            if (!logs || logs.length === 0) {
                window.alert('No data to export');
                return;
            }
            const rows = logs.map(l => ({ level: l.status, service: l.actionType || l.metadata?.service || 'unknown', id: l.id, message: l.errorMessage || l.metadata?.message || '' }));
            const csv = ["Level,Service,Request ID,Message", ...rows.map(r => `"${(r.level || '')}","${(r.service || '')}","${(r.id || '')}","${((r.message || '') + '').replace(/"/g, '""')}"`)].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            window.alert('Exported logs');
        } catch (e) {
            console.error('Export failed', e);
            window.alert('Export failed');
        }
    };



    const services = Array.from(new Set((logs || []).map(l => l.actionType || l.metadata?.service).filter(Boolean)));

    // small state for row expansion
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedRowId(prev => prev === id ? null : id);
    };

    // Minimal pagination helper for rendering pages
    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
    const pagesToShow = (() => {
        const pages = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    })();

    return (
        <AdminLayout>
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <div className="px-6 pt-4 pb-2">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <a className="hover:text-primary transition-colors" href="#">Home</a>
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                <a className="hover:text-primary transition-colors" href="#">System</a>
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                <span className="text-slate-900 dark:text-white font-medium">Logs</span>
                            </div>
                        </div>
                        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Logs</h1>

                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor system health, errors, and activity across all services.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">update</span>
                                        <span>Last updated: {lastUpdated ? dayjs(lastUpdated).format('YYYY-MM-DD HH:mm:ss') : 'just now'}</span>
                                    </div>
                                </div>
                                <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                                    Refresh
                                </button>
                                <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                    Export Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-background-light dark:bg-background-dark">
                    <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                            <div className="flex flex-col lg:flex-row gap-4 justify-between">
                                <div className="flex-1 max-w-lg">
                                    <label className="relative block">
                                        <span className="sr-only">Search</span>
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <span className="material-symbols-outlined">search</span>
                                        </span>
                                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Request ID or log content..." className="placeholder:text-slate-400 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm" />
                                    </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative group">
                                        <select value={rangeOption} onChange={(e) => setRangeOption(e.target.value as any)} className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary/50 transition-colors">
                                            <option value="last_24h">Last 24 Hours</option>
                                            <option value="last_7d">Last 7 Days</option>
                                            <option value="last_30d">Last 30 Days</option>
                                            <option value="this_month">This Month</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <select value={level || ''} onChange={(e) => setLevel(e.target.value || null)} className="appearance-none cursor-pointer pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary/50 focus:border-primary focus:ring-primary focus:outline-none transition-colors">
                                            <option value="">All Levels</option>
                                            <option value="info">Info</option>
                                            <option value="warning">Warning</option>
                                            <option value="error">Error</option>
                                        </select>
                                        <span className="absolute left-3 top-2.5 material-symbols-outlined text-[20px] text-slate-400 pointer-events-none">filter_list</span>
                                    </div>
                                    <div className="relative">
                                        <select value={service || ''} onChange={(e) => setService(e.target.value || null)} className="appearance-none cursor-pointer pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary/50 focus:border-primary focus:ring-primary focus:outline-none transition-colors">
                                            <option value="">All Services</option>
                                            {services.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <span className="absolute left-3 top-2.5 material-symbols-outlined text-[20px] text-slate-400 pointer-events-none">dns</span>
                                    </div>
                                    <button onClick={() => {
                                        // Reset filters and range to Last 24 Hours, then reload
                                        setQuery('');
                                        setLevel(null);
                                        setService(null);
                                        setRangeOption('last_24h');
                                        const newRange = computeRange('last_24h');
                                        setTimeRange(newRange);
                                        setPage(1);
                                        // immediate fetch with new range
                                        fetchLogs({ offset: 0, limit: pageSize });
                                    }} className="text-sm text-primary font-medium hover:underline px-2">Clear</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <th className="px-6 py-4 w-48 cursor-pointer" onClick={() => { setSortField('createdAt'); setSortOrder(sortOrder === 'descend' ? 'ascend' : 'descend'); }}>Timestamp</th>
                                            <th className="px-6 py-4 w-32">Level</th>
                                            <th className="px-6 py-4 w-32">Service</th>
                                            <th className="px-6 py-4 w-48">Request ID</th>
                                            <th className="px-6 py-4">Message</th>
                                            <th className="px-4 py-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-text-sub-light">Loading logs...</td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-text-sub-light">No logs found</td>
                                            </tr>
                                        ) : (
                                            logs.map((rec: any) => {
                                                const lvl = (rec.level || (rec.status || '')).toString().toLowerCase();
                                                const svc = rec.actionType || rec.metadata?.service || 'Unknown';
                                                const color = serviceColorMapRef.current.get(svc) || '#6b7280';
                                                return (
                                                    <>
                                                        <tr key={rec.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">{rec.createdAt ? dayjs(rec.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {lvl === 'error' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"><span className="material-symbols-outlined text-[14px]">error</span>Error</span>
                                                                ) : lvl === 'warning' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><span className="material-symbols-outlined text-[14px]">warning</span>Warning</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><span className="material-symbols-outlined text-[14px]">info</span>Info</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: color, color: '#fff' }}>{svc}</span></td>
                                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-primary dark:text-blue-400 hover:underline">{rec.id}</td>
                                                            <td className="px-6 py-4 text-slate-900 dark:text-white font-mono text-xs truncate max-w-md">{rec.errorMessage || rec.metadata?.message || ''}</td>
                                                            <td className="px-4 py-4 text-right">
                                                                <button onClick={() => toggleExpand(rec.id)} className="text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"><span className="material-symbols-outlined text-[20px]">content_copy</span></button>
                                                            </td>
                                                        </tr>
                                                        {expandedRowId === rec.id && (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-4 bg-background-light dark:bg-slate-800"><pre className="text-xs break-words p-3 rounded">{JSON.stringify(rec, null, 2)}</pre></td>
                                                            </tr>
                                                        )}
                                                    </>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Showing <span className="font-medium text-slate-900 dark:text-white">{Math.min(1 + (page - 1) * pageSize, total || 0)}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(page * pageSize, total || 0)}</span> of <span className="font-medium text-slate-900 dark:text-white">{total || 0}</span> results</p>
                                <div className="flex items-center gap-2">
                                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className={`flex items-center justify-center size-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 ${page === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                                    {pagesToShow.map(p => (
                                        <button key={p} onClick={() => setPage(p)} className={`flex items-center justify-center size-8 rounded-lg ${p === page ? 'bg-primary text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'} text-sm font-medium transition-colors`}>{p}</button>
                                    ))}
                                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} className="flex items-center justify-center size-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-10"></div>
                </div>
            </main>
        </AdminLayout>
    );
}
