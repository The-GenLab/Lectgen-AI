import { Card } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/AdminLayout';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    return (
        <AdminLayout>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>
                        System overview and quick insights at a glance.
                    </p>
                </div>

                <Card
                    style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12
                    }}
                >
                    <RocketOutlined style={{ fontSize: 64, marginBottom: 24, color: '#ffd700' }} />
                    <h2 style={{ color: 'white', marginBottom: 12 }}>Dashboard Coming Soon</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
                        We're building an amazing dashboard experience for you.
                        Check out Usage & Quota for detailed analytics in the meantime!
                    </p>
                </Card>
            </div>
        </AdminLayout>
    );
}

