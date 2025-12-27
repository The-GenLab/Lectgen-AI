import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, DatePicker, Button } from 'antd';
import { DollarOutlined, UserOutlined, CrownOutlined, ThunderboltOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/AdminLayout';
import { getGlobalStats, getUsageLogs } from '../../api/admin';
import type { GlobalStats } from '../../api/admin';
import styles from './AdminDashboard.module.css';
import StatCard from '../../components/StatCard/StatCard';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<any>(null);
    const [granularity, setGranularity] = useState<'day' | 'month' | 'year'>('day');
    const [timeSeries, setTimeSeries] = useState<any[]>([]);
    const [inputSourceData, setInputSourceData] = useState<any[]>([]);



    useEffect(() => {
        fetchStats();
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
            const start = startIso ? new Date(startIso) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);

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
            });

            const series = Object.keys(counts).sort().map(k => ({ date: k, value: counts[k] }));
            setTimeSeries(series);

            const sourceData = Object.entries(inputCounts).map(([name, value]) => ({ name, value }));
            setInputSourceData(sourceData);
        } catch (err) {
            console.error('Failed to load usage logs for chart', err);
        }
    };

    // xuất file csv
    const exportReport = () => {
        const rows: string[] = [];
        rows.push('Metric,Value');
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
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
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <AdminLayout>
            <div className={styles.content}>
                <div className={styles.headerRow}>
                    <div>
                        <h1 className={styles.title}>Dashboard Overview</h1>
                        <p className={styles.subtitle} style={{ color: '#6c757d', marginTop: 4, fontSize: 15 }}>Monitor system-wide AI resource consumption and user quotas.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <DatePicker.RangePicker value={range} onChange={(vals) => {
                            if (!vals) {
                                setRange(null);
                                fetchStats();
                                return;
                            }
                            const [s, e]: any = vals;
                            // store the raw moment/dayjs values so the picker remains controlled
                            setRange(vals);

                            const sIso = s.startOf('day').toISOString();
                            const eIso = e.endOf('day').toISOString();
                            fetchStats(sIso, eIso);
                        }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button size="small" onClick={() => { setGranularity('day'); fetchUsageLogsForChart(range?.[0], range?.[1], 'day'); }}>Day</Button>
                            <Button size="small" onClick={() => { setGranularity('month'); fetchUsageLogsForChart(range?.[0], range?.[1], 'month'); }}>Month</Button>
                            <Button size="small" onClick={() => { setGranularity('year'); fetchUsageLogsForChart(range?.[0], range?.[1], 'year'); }}>Year</Button>
                        </div>
                        <Button type="primary" onClick={() => exportReport()}>Export Report</Button>
                    </div>
                </div>

                {/* KPI Cards (UI updated to show trends from real data only) */}
                <Row gutter={[16, 16]} className={styles.kpiRow}>
                    {(() => {
                        const getTrend = (key: string) => {
                            if (!stats?.comparison) return null;
                            switch (key) {
                                case 'Total Users':
                                    return typeof stats.comparison.freeUserGrowth === 'number' ? stats.comparison.freeUserGrowth : null;
                                case 'VIP Users':
                                    return typeof stats.comparison.vipRetention === 'number' ? stats.comparison.vipRetention : null;
                                case 'Slides Gen':
                                    return typeof stats.comparison.slidesChange === 'number' ? stats.comparison.slidesChange : null;
                                default:
                                    return null;
                            }
                        };

                        const cards = [
                            { title: 'Total Users', value: stats?.totalUsers || 0, icon: <UserOutlined />, key: 'Total Users', colorClass: 'iconBlue' },
                            { title: 'VIP Users', value: stats?.usersByRole?.VIP || 0, icon: <CrownOutlined />, key: 'VIP Users', colorClass: 'iconPurple' },
                            { title: 'Slides Gen', value: stats?.totalCalls || 0, icon: <ThunderboltOutlined />, key: 'Slides Gen', colorClass: 'iconGold' },
                            { title: 'Revenue', value: stats?.totalCost ? Number(stats.totalCost).toFixed(2) : '0.00', icon: <DollarOutlined />, key: 'Revenue', colorClass: 'iconGreen' },
                            { title: 'Avg. Gen Time', value: stats?.vipMetrics?.avgResponseTime || 0, suffix: 'ms', icon: <ClockCircleOutlined />, key: 'Avg. Gen Time', colorClass: 'iconTeal' },
                            { title: 'Error Rate', value: ((100 - (stats?.successRate || 0))).toFixed(1), icon: <WarningOutlined />, suffix: '%', key: 'Error Rate', colorClass: 'iconRed' },
                        ];

                        return cards.map((c) => {
                            const trendVal = getTrend(c.key);
                            const showTrend = typeof trendVal === 'number' && !isNaN(trendVal);
                            const isUp = showTrend ? trendVal >= 0 : null;
                            const valueDisplay = c.value;

                            // derive color name from existing colorClass (iconBlue -> blue)
                            const colorName = (c.colorClass || 'iconBlue').replace('icon', '').toLowerCase();

                            return (
                                <Col xs={24} sm={12} md={8} lg={4} key={c.key}>
                                    <div style={{ height: '100%' }}>
                                        <StatCard
                                            title={c.title}
                                            value={valueDisplay}
                                            suffix={c.suffix}
                                            icon={c.icon}
                                            color={colorName as any}
                                            iconPosition="left"
                                            align={/* left-align number to match Usage style */ 'left'}
                                            trend={showTrend ? { value: Number(trendVal), direction: isUp ? 'up' : 'down' } : undefined}
                                            trendLabel={showTrend ? 'vs last period' : undefined}
                                        />
                                    </div>
                                </Col>
                            );
                        });
                    })()}
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} lg={16}>
                        <Card title="Slides Generated Over Time">
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer>
                                    <LineChart data={timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="User Distribution" style={{ marginBottom: 16 }}>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={userDist}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={60}
                                            label
                                        >
                                            {userDist.map((_, index) => (
                                                <Cell key={`cell-user-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Input Source">
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={inputSourceData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={60}
                                            label
                                        >
                                            {inputSourceData.map((_, index) => (
                                                <Cell key={`cell-src-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}

