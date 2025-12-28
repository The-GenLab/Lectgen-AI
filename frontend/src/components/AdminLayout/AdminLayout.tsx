import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    FileText,
    LogOut,
    Crown
} from 'lucide-react';
import { getAvatarUrl } from '../../utils/file';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
    children: ReactNode;
}

interface MenuItem {
    key: string;
    icon: ReactNode;
    label: string;
    path: string;
}

const menuItems: MenuItem[] = [
    {
        key: 'dashboard',
        icon: <LayoutDashboard size={20} />,
        label: 'Dashboard',
        path: '/admin'
    },
    {
        key: 'users',
        icon: <Users size={20} />,
        label: 'Users',
        path: '/admin/users'
    },
    {
        key: 'usage',
        icon: <BarChart3 size={20} />,
        label: 'Usage & Quota',
        path: '/admin/usage'
    },
    {
        key: 'settings',
        icon: <Settings size={20} />,
        label: 'Settings',
        path: '/admin/settings'
    },
    {
        key: 'logs',
        icon: <FileText size={20} />,
        label: 'Logs',
        path: '/admin/logs'
    }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        document.cookie.split(";").forEach(c => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        navigate('/login');
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                {/* Logo */}
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Crown size={24} />
                    </div>
                    <div className={styles.logoText}>
                        <div className={styles.logoTitle}>LectGen-AI</div>
                        <div className={styles.logoSubtitle}>Admin Console</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {menuItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.key}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        {user.avatarUrl && getAvatarUrl(user.avatarUrl) ? (
                            <div 
                                className={styles.userAvatar}
                                style={{ 
                                    backgroundImage: `url(${getAvatarUrl(user.avatarUrl)})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        ) : (
                            <div className={styles.userAvatar}>
                                {user.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                        )}
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>{user.name || 'Admin'}</div>
                            <div className={styles.userRole}>Super Admin</div>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
