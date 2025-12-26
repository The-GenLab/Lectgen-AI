import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>LectGen Admin</h1>
          
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.email}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
            <button 
              className={styles.userAvatar}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </button>
            
            {showUserMenu && (
              <div className={styles.userMenu}>
                <button onClick={() => navigate('/profile')} className={styles.menuItem}>
                  Profile
                </button>
                <button onClick={handleLogout} className={styles.menuItem}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          <h2 className={styles.title}>Admin Dashboard</h2>
          <p className={styles.subtitle}>Welcome to the admin panel</p>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>0</h3>
                <p className={styles.statLabel}>Total Users</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📄</div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>0</h3>
                <p className={styles.statLabel}>Total Slides</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>💼</div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>0</h3>
                <p className={styles.statLabel}>Active Subscriptions</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>0</h3>
                <p className={styles.statLabel}>Monthly Revenue</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <button className={styles.actionCard}>
                <span className={styles.actionIcon}>👤</span>
                <span className={styles.actionText}>Manage Users</span>
              </button>
              <button className={styles.actionCard}>
                <span className={styles.actionIcon}>⚙️</span>
                <span className={styles.actionText}>System Settings</span>
              </button>
              <button className={styles.actionCard}>
                <span className={styles.actionIcon}>📈</span>
                <span className={styles.actionText}>View Analytics</span>
              </button>
              <button className={styles.actionCard}>
                <span className={styles.actionIcon}>💳</span>
                <span className={styles.actionText}>Billing</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
