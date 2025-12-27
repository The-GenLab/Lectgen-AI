import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Input, Select, DatePicker, Button, Table, Badge, Space, message, Switch, Tag } from 'antd';
import AdminLayout from '../../components/AdminLayout';
import { getUsageLogs } from '../../api/admin';
import styles from './AdminSystemLogs.module.css';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Search } = Input;

export default function AdminSystemLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState<string | null>(null);
    const [service, setService] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<any>(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [sortField, setSortField] = useState<string | null>('createdAt');
    const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('descend');

    const fetchCounterRef = useRef(0);
    const serviceColorMapRef = useRef<Map<string, string>>(new Map());
    const colorPalette = ['#60a5fa', '#34d399', '#f97316', '#a78bfa', '#f472b6', '#f59e0b', '#ef4444'];

    const fetchLogs = useCallback(async (opts?: { offset?: number; limit?: number }) => {
        const fetchId = ++fetchCounterRef.current;
        try {
            if (fetchId === 1) setLoading(true); // initial
            else setLoading(true);

            const params: any = { limit: opts?.limit ?? pageSize, offset: opts?.offset ?? (page - 1) * pageSize };
            if (timeRange) {
                params.startDate = dayjs(timeRange[0]).startOf('day').toISOString();
                params.endDate = dayjs(timeRange[1]).endOf('day').toISOString();
            }
            if (service) params.actionType = service;
            if (level) {
                // send friendly levels (error/warning/info) to server and let server map to internal
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
            message.error(serverMsg);
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

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(() => {
            fetchLogs({ offset: (page - 1) * pageSize, limit: pageSize });
        }, 30000);
        return () => clearInterval(id);
    }, [autoRefresh, fetchLogs, page, pageSize]);

    const onRefresh = () => fetchLogs({ offset: 0, limit: pageSize });

    const onExport = () => {
        try {
            if (!logs || logs.length === 0) {
                message.warning('No data to export');
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
            message.success('Exported logs');
        } catch (e) {
            console.error('Export failed', e);
            message.error('Export failed');
        }
    };

    const columns = [
        {
            title: 'Level',
            dataIndex: 'status',
            width: 120,
            render: (_: any, rec: any) => {
                // prefer normalized 'level' field added by backend (error/warning/info)
                const lvl = (rec.level || (rec.status || '')).toString().toLowerCase();
                if (lvl === 'error') return <Badge status="error" text="Error" />;
                if (lvl === 'warning') return <Badge status="warning" text="Warning" />;
                return <Badge status="processing" text="Info" />;
            }
        },
        {
            title: 'Time',
            dataIndex: 'createdAt',
            width: 180,
            render: (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-',
            sorter: true,
        },
        {
            title: 'Service',
            dataIndex: 'actionType',
            width: 160,
            render: (_t: any, rec: any) => {
                const svc = rec.actionType || rec.metadata?.service || 'Unknown';
                const color = serviceColorMapRef.current.get(svc) || '#6b7280';
                return <Tag style={{ background: color, color: '#fff', fontWeight: 600 }}>{svc}</Tag>;
            }
        },
        {
            title: 'Request ID',
            dataIndex: 'id',
            width: 160,
            render: (id: string) => <a href={`#${id}`}>{id}</a>
        },
        {
            title: 'Message',
            dataIndex: 'errorMessage',
            render: (_: any, rec: any) => rec.errorMessage || rec.metadata?.message || ''
        }
    ];

    const services = Array.from(new Set((logs || []).map(l => l.actionType || l.metadata?.service).filter(Boolean)));

    return (
        <AdminLayout>
            <div className={styles.container}>
                <div className={styles.headerRow}>
                    <div>
                        <h1 className={styles.title}>LectGen-AI System Logs</h1>
                        <p className={styles.subtitle}>View recent system activity across all services.</p>
                    </div>
                    <Space>
                        <Button onClick={onRefresh}>Refresh</Button>
                        <Button type="primary" onClick={onExport}>Export Logs</Button>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Switch checked={autoRefresh} onChange={(v) => setAutoRefresh(v)} />
                            <span style={{ color: '#6c757d', fontSize: 13 }}>{lastUpdated ? `Last updated: ${dayjs(lastUpdated).format('YYYY-MM-DD HH:mm:ss')}` : 'Last updated: -'}</span>
                        </span>
                    </Space>
                </div>

                <Card className={styles.filterCard} bordered={false}>
                    <div className={styles.filters}>
                        <Search
                            placeholder="Search messages or request id..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onSearch={(v) => { setQuery(v); }}
                            allowClear
                            style={{ width: 360 }}
                        />
                        <RangePicker value={timeRange} onChange={(vals: any) => { setTimeRange(vals); }} />
                        <Select placeholder="All Levels" allowClear style={{ width: 140 }} value={level || undefined} onChange={(v) => { setLevel(v || null); }}>
                            <Select.Option value="error">Error</Select.Option>
                            <Select.Option value="warning">Warning</Select.Option>
                            <Select.Option value="info">Info</Select.Option>
                        </Select>
                        <Select placeholder="All Services" allowClear style={{ width: 180 }} value={service || undefined} onChange={(v) => { setService(v || null); }}>
                            {services.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                        </Select>
                        <Button onClick={() => { setQuery(''); setTimeRange(null); setLevel(null); setService(null); setPage(1); }}>Clear</Button>
                    </div>
                </Card>

                <Card style={{ marginTop: 16 }}>
                    <Table
                        columns={columns}
                        dataSource={logs}
                        loading={loading}
                        rowKey={(r) => r.id}
                        onChange={(pagination, _filters, sorter: any) => {
                            if (pagination.current !== undefined && pagination.current !== page) setPage(pagination.current);
                            if (pagination.pageSize !== undefined && pagination.pageSize !== pageSize) { setPageSize(pagination.pageSize); setPage(1); }
                            if (sorter && (sorter.field || sorter.order)) {
                                setSortField(sorter.field || null);
                                setSortOrder(sorter.order || null);
                                setPage(1);
                            }
                        }}
                        expandable={{
                            expandedRowRender: (rec: any) => <pre className={styles.expandPre}>{JSON.stringify(rec, null, 2)}</pre>,
                            rowExpandable: () => true
                        }}
                        pagination={{
                            current: page,
                            pageSize,
                            total,
                            onChange: (p, ps) => { if (p !== undefined) setPage(p); if (ps !== undefined) setPageSize(ps); }
                        }}
                    />
                </Card>
            </div>
        </AdminLayout>
    );
}
