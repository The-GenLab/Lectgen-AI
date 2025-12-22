import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, message, Spin } from 'antd';
import {
    UserOutlined,
    ThunderboltOutlined,
    CrownOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import { getGlobalStats } from '../../api/admin';
import type { GlobalStats } from '../../api/admin';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getGlobalStats();
            console.log('Stats data:', data); // Debug log
            setStats(data);
        } catch (error: any) {
            console.error('Fetch stats error:', error); // Debug log
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch stats';
            setError(errorMsg);
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="large" tip="Loading admin dashboard..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.loadingContainer}>
                <Card>
                    <h3>Error Loading Dashboard</h3>
                    <p>{error}</p>
                    <button onClick={fetchStats}>Retry</button>
                </Card>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Usage & Quota Overview</h1>
                        <p className={styles.subtitle}>
                            Monitor system-wide AI resource consumption and user quotas.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row gutter={[24, 24]} className={styles.statsRow}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.statCard}>
                            <Statistic
                                title="Next Quota Reset"
                                value={(() => {
                                    const now = new Date();
                                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                                    return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                })()}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                            <div className={styles.statMeta}>
                                {(() => {
                                    const now = new Date();
                                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                                    const daysUntil = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    return `Global monthly reset in ${daysUntil} days`;
                                })()}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.statCard}>
                            <Statistic
                                title="Total Tokens"
                                value={stats?.totalTokens || 0}
                                prefix={<ThunderboltOutlined />}
                                valueStyle={{ color: '#1677ff' }}
                            />
                            <div className={styles.statMeta}>Total usage across all users</div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.statCard}>
                            <Statistic
                                title="Active Free Users"
                                value={stats?.usersByRole?.FREE || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                            <div className={styles.statMeta}>Free tier accounts</div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.statCard}>
                            <Statistic
                                title="Active VIP Users"
                                value={stats?.usersByRole?.VIP || 0}
                                prefix={<CrownOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                            <div className={styles.statMeta}>Premium subscribers</div>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Section */}
                <Row gutter={[24, 24]} className={styles.chartsRow}>
                    <Col xs={24} lg={14}>
                        <Card title="Usage by Input Type" className={styles.chartCard}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={[
                                        { name: 'Text Input', value: stats?.byActionType?.['TEXT_GENERATION'] || 0 },
                                        { name: 'Voice Input', value: stats?.byActionType?.['VOICE_TO_TEXT'] || 0 },
                                        { name: 'File Upload', value: stats?.byActionType?.['PDF_GENERATION'] || 0 },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#1677ff" name="Usage Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card title="Usage by Role" className={styles.chartCard}>
                            <div style={{ padding: '20px 0' }}>
                                {(() => {
                                    const freeCount = stats?.usersByRole?.FREE || 0;
                                    const vipCount = stats?.usersByRole?.VIP || 0;
                                    const adminCount = stats?.usersByRole?.ADMIN || 0;
                                    const total = stats?.totalUsers || 1;

                                    const freePercent = Math.round((freeCount / total) * 100);
                                    const vipPercent = Math.round((vipCount / total) * 100);
                                    const adminPercent = Math.round((adminCount / total) * 100);

                                    return (
                                        <>
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 500 }}>Free Users ({freeCount})</span>
                                                    <span style={{ color: '#8c8c8c' }}>{freePercent}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${freePercent}%`, height: '100%', backgroundColor: '#52c41a', transition: 'width 0.3s' }}></div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 500 }}>VIP Users ({vipCount})</span>
                                                    <span style={{ color: '#8c8c8c' }}>{vipPercent}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${vipPercent}%`, height: '100%', backgroundColor: '#faad14', transition: 'width 0.3s' }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 500 }}>Admin Users ({adminCount})</span>
                                                    <span style={{ color: '#8c8c8c' }}>{adminPercent}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${adminPercent}%`, height: '100%', backgroundColor: '#1677ff', transition: 'width 0.3s' }}></div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Quota Watch & VIP Status */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title="Free Tier Quota Watch"
                            extra={<a href="#">View All</a>}
                            className={styles.quotaCard}
                        >
                            <div className={styles.comingSoon}>Quota list coming soon...</div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card className={styles.vipCard}>
                            <h3>🏆 VIP Status Overview</h3>
                            <p>VIP users have unlimited generation access. Monitor system load to ensure premium performance.</p>
                            <div className={styles.comingSoon}>VIP metrics coming soon...</div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}

