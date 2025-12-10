import { useState } from 'react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [input, setInput] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSubmit = () => {
    if (!input.trim()) return;
    // TODO: Send message to backend
    console.log('Send message:', input);
  };

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
          <button className={styles.userProfile}>
            <div className={styles.avatar}>
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className={styles.userName}>
              {user.email?.split('@')[0] || 'User'}
            </span>
            <span className={styles.userBadge}>Free</span>
          </button>
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
