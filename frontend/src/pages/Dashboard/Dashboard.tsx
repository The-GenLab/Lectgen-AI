import { useState, useRef, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { logout } from '../../utils/auth';

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (!input.trim()) return;
    // TODO: Send message to backend
    console.log('Send message:', input);
  };

  const handleLogout = () => {
    logout(); // Hàm logout đã có window.location.href, không cần navigate
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Đoạn chat mới
          </button>
        </div>

        <div className={styles.chatHistory}>
          <div className={styles.historySection}>
            <div className={styles.historyTitle}>Các đoạn chat của bạn</div>
            {/* Placeholder for chat history */}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <button className={styles.menuItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6M1 12h6m6 0h6" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Thư viện
          </button>
          <button className={styles.menuItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Dự án
          </button>
          <div className={styles.userProfileWrapper} ref={menuRef}>
            <button 
              className={styles.userProfile}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className={styles.avatar}>
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className={styles.userName}>
                {user.email?.split('@')[0] || 'User'}
              </span>
              <span className={styles.userBadge}>Free</span>
            </button>

            {showUserMenu && (
              <div className={styles.userMenu}>
                <div className={styles.userMenuHeader}>
                  <div className={styles.avatar}>
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userDisplayName}>
                      {user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                  <span className={styles.userBadgeMenu}>Free</span>
                </div>

                <div className={styles.userMenuDivider}></div>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
                  </svg>
                  Nâng cấp gói
                </button>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                  </svg>
                  Cá nhân hóa
                </button>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.488.488 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
                  </svg>
                  Cài đặt
                </button>

                <div className={styles.userMenuDivider}></div>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="currentColor"/>
                  </svg>
                  Trợ giúp
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
                    <path d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z" fill="currentColor"/>
                  </svg>
                </button>

                <button className={styles.userMenuItem} onClick={handleLogout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>ChatGPT</h1>
          <button className={styles.upgradeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
            </svg>
            Nâng cấp lên Go
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.emptyState}>
            <h2 className={styles.greeting}>Chúng ta nên bắt đầu từ đâu?</h2>
          </div>
        </div>

        <div className={styles.inputSection}>
          <div className={styles.inputWrapper}>
            <button className={styles.addBtn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              type="text"
              className={styles.input}
              placeholder="Hỏi bất kỳ điều gì"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button className={styles.voiceBtn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 013 3v8a3 3 0 11-6 0V4a3 3 0 013-3z" stroke="currentColor" strokeWidth="2"/>
                <path d="M19 10v2a7 7 0 11-14 0v-2M12 19v4m-4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button 
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor"/>
                <path d="M10 8l6 4-6 4V8z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
