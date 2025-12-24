import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, message, Spin, Button } from 'antd';
import {
    UserOutlined,
    ThunderboltOutlined,
    CrownOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import { getGlobalStats } from '../../api/admin';
import type { GlobalStats } from '../../api/admin';
import styles from './AdminUsageQuota.module.css';

const AdminUsageQuota = () => {
    const navigate = useNavigate();
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
            console.log('Stats data:', data);
            setStats(data);
        } catch (error: any) {
            console.error('Fetch stats error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch stats';
            setError(errorMsg);
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Spin size="large" tip="Loading usage data..." />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Card>
                        <h3>Error Loading Data</h3>
                        <p>{error}</p>
                        <button onClick={fetchStats}>Retry</button>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Usage & Quota Overview</h1>
                        <p className={styles.subtitle}>
                            Monitor system-wide AI resource consumption and user quotas.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.summaryCard}>
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
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
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
                        <Card className={styles.summaryCard}>
                            <Statistic
                                title="Total Tokens"
                                value={(stats?.totalTokens || 0) > 1000 ? `${((stats?.totalTokens || 0) / 1000).toFixed(1)}k` : (stats?.totalTokens || 0)}
                                prefix={<ThunderboltOutlined />}
                                valueStyle={{ color: '#1677ff' }}
                            />
                            <div style={{
                                fontSize: '12px',
                                color: (stats?.comparison?.tokenChange || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                                marginTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                {(stats?.comparison?.tokenChange || 0) >= 0 ? (
                                    <ArrowUpOutlined style={{ fontSize: 10 }} />
                                ) : (
                                    <ArrowDownOutlined style={{ fontSize: 10 }} />
                                )}
                                <span>{Math.abs(stats?.comparison?.tokenChange || 0)}% vs last month</span>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.summaryCard}>
                            <Statistic
                                title="Active Free Users"
                                value={stats?.usersByRole?.FREE || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                            <div style={{
                                fontSize: '12px',
                                color: (stats?.comparison?.freeUserGrowth || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                                marginTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                {(stats?.comparison?.freeUserGrowth || 0) >= 0 ? (
                                    <ArrowUpOutlined style={{ fontSize: 10 }} />
                                ) : (
                                    <ArrowDownOutlined style={{ fontSize: 10 }} />
                                )}
                                <span>{Math.abs(stats?.comparison?.freeUserGrowth || 0)}% new signups</span>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.summaryCard}>
                            <Statistic
                                title="Active VIP Users"
                                value={stats?.usersByRole?.VIP || 0}
                                prefix={<CrownOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                            <div style={{
                                fontSize: '12px',
                                color: (stats?.comparison?.vipRetention || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                                marginTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                {(stats?.comparison?.vipRetention || 0) >= 0 ? (
                                    <ArrowUpOutlined style={{ fontSize: 10 }} />
                                ) : (
                                    <ArrowDownOutlined style={{ fontSize: 10 }} />
                                )}
                                <span>{Math.abs(stats?.comparison?.vipRetention || 0)}% retention rate</span>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Section */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={14}>
                        <Card title="Usage by Input Type" className={styles.chartCard} style={{ height: '100%', minHeight: 400 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={[
                                        { name: 'Text Input', value: stats?.byActionType?.['AI_GENERATION'] || 0 },
                                        { name: 'Voice Input', value: stats?.byActionType?.['SPEECH_TO_TEXT'] || 0 },
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
                        <Card title="Usage by Role" className={styles.chartCard} style={{ height: '100%', minHeight: 400 }}>
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
                            extra={<a onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>View All</a>}
                            className={styles.chartCard}
                            style={{ height: '100%', minHeight: 380 }}
                        >
                            {stats?.quotaStatus && stats.quotaStatus.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {stats.quotaStatus.map((item, index) => (
                                        <div key={index} style={{ padding: 12, background: '#f7fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                                <UserOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                                                <span style={{ fontWeight: 500 }}>{item.userName}</span>
                                                <span style={{
                                                    marginLeft: 'auto',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: item.usagePercent >= 90 ? '#ff4d4f' :
                                                        item.usagePercent >= 70 ? '#faad14' : '#52c41a',
                                                    color: '#fff'
                                                }}>
                                                    {item.used}/{item.limit}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: '6px',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${item.usagePercent}%`,
                                                        height: '100%',
                                                        backgroundColor: item.usagePercent >= 90 ? '#ff4d4f' :
                                                            item.usagePercent >= 70 ? '#faad14' : '#52c41a',
                                                        transition: 'width 0.3s'
                                                    }}></div>
                                                </div>
                                                <div style={{
                                                    marginTop: 4,
                                                    fontSize: '12px',
                                                    color: '#8c8c8c',
                                                    textAlign: 'right'
                                                }}>
                                                    {item.usagePercent}% used
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150, color: '#a0aec0' }}>
                                    <p>No quota data available</p>
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card className={styles.vipCard} style={{
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            minHeight: 380,
                            height: '100%',
                            border: 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                <CrownOutlined style={{ fontSize: 24, color: '#ffd700', marginRight: 12 }} />
                                <h3 style={{ fontSize: 20, fontWeight: 600, color: 'white', margin: 0 }}>VIP Status Overview</h3>
                            </div>
                            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                                VIP users have unlimited generation access. Monitor system load to ensure premium performance.
                            </p>

                            {stats?.vipMetrics ? (
                                <>
                                    <div style={{ marginBottom: 20 }}>
                                        <Row gutter={[16, 16]}>
                                            <Col span={12}>
                                                <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: 8, padding: 16 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.5, marginBottom: 8 }}>SYSTEM LOAD</div>
                                                    <div style={{ fontSize: 20, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center' }}>
                                                        <span style={{
                                                            color: stats.vipMetrics.systemLoad >= 80 ? '#ff4d4f' :
                                                                stats.vipMetrics.systemLoad >= 60 ? '#faad14' : '#52c41a'
                                                        }}>
                                                            {stats.vipMetrics.systemLoad < 60 ? 'Normal' :
                                                                stats.vipMetrics.systemLoad < 80 ? 'Moderate' : 'High'}
                                                        </span>
                                                        <CheckCircleOutlined style={{
                                                            marginLeft: 8,
                                                            color: stats.vipMetrics.systemLoad >= 80 ? '#ff4d4f' :
                                                                stats.vipMetrics.systemLoad >= 60 ? '#faad14' : '#52c41a'
                                                        }} />
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col span={12}>
                                                <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: 8, padding: 16 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.5, marginBottom: 8 }}>PRIORITY QUEUE</div>
                                                    <div style={{ fontSize: 20, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center' }}>
                                                        {stats.vipMetrics.avgResponseTime}ms Delay
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                        <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                                            {stats.vipMetrics.activeVipUsers} Active VIPs
                                        </span>
                                        <Button style={{ background: 'white', color: '#667eea', border: 'none', fontWeight: 500, borderRadius: 6 }}>
                                            Manage Tiers
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
                                    <p>No VIP metrics available</p>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
};

export default AdminUsageQuota;
