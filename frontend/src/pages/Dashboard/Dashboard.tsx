import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { logout } from '../../utils/auth';
import PDFPreview from '../../components/PDFPreview';
import { getUserPDFs } from '../../api/pdf';
import { getProfile } from '../../api/user';
import type { PDFDocument } from '../../api/pdf';
import { getAvatarUrl } from '../../utils/file';

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getProfile();
        if (response.success) {
          setUser(response.data.user); // Fix: response.data.user chứ không phải response.data
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Redirect to login if unauthorized
        logout();
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch user's PDFs on mount
  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const data = await getUserPDFs();
        setPdfs(data);
      } catch (error) {
        console.error('Failed to fetch PDFs:', error);
        // Fall back to mock data for development
        setPdfs([
          {
            id: 'pdf-1',
            conversationId: 'conv-123',
            fileName: 'Bài giảng Machine Learning.pdf',
            fileUrl: 'https://example.com/lecture-1.pdf',
            fileSize: 1024000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'pdf-2',
            conversationId: 'conv-456',
            fileName: 'Giới thiệu về AI và Deep Learning.pdf',
            fileUrl: 'https://example.com/lecture-2.pdf',
            fileSize: 2048000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ]);
      }
    };

    fetchPDFs();
  }, []);

  const handleSubmit = () => {
    if (!input.trim() && uploadedImages.length === 0) return;
    // TODO: Send message + images to backend
    console.log('Send message:', input);
    console.log('With images:', uploadedImages.length);
    // Clear after send
    setInput('');
    setUploadedImages([]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Filter valid images
    const validImages = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} không phải là file ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    // Add to uploaded images (allow multiple)
    setUploadedImages(prev => [...prev, ...validImages]);
    setShowUploadMenu(false);

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddButtonClick = () => {
    setShowUploadMenu(!showUploadMenu);
  };

  const handleImageOptionClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    logout();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    };

    if (showUserMenu || showUploadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showUploadMenu]);

  // Show loading state
  if (isLoadingUser || !user) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <path d="M12 1v6m0 6v6M1 12h6m6 0h6" stroke="currentColor" strokeWidth="2" />
            </svg>
            Thư viện
          </button>
          <button className={styles.menuItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
            </svg>
            Dự án
          </button>
          <div className={styles.userProfileWrapper} ref={menuRef}>
            <button
              className={styles.userProfile}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {getAvatarUrl(user.avatarUrl) ? (
                <img src={getAvatarUrl(user.avatarUrl)!} alt="Avatar" className={styles.avatar} style={{ objectFit: 'cover' }} />
              ) : (
                <div className={styles.avatar}>
                  {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className={styles.userName}>
                {user.name || user.email?.split('@')[0] || 'User'}
              </span>
              <span className={styles.userBadge}>Free</span>
            </button>

            {showUserMenu && (
              <div className={styles.userMenu}>
                <button className={styles.userMenuHeader} onClick={() => navigate('/profile')}>
                  {getAvatarUrl(user.avatarUrl) ? (
                    <img src={getAvatarUrl(user.avatarUrl)!} alt="Avatar" className={styles.avatar} style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className={styles.avatar}>
                      {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <div className={styles.userDisplayName}>
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                  <span className={styles.userBadgeMenu}>Free</span>
                </button>

                <div className={styles.userMenuDivider}></div>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
                  </svg>
                  Nâng cấp gói
                </button>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                  </svg>
                  Cá nhân hóa
                </button>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.488.488 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor" />
                  </svg>
                  Cài đặt
                </button>

                <div className={styles.userMenuDivider}></div>

                <button className={styles.userMenuItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="currentColor" />
                  </svg>
                  Trợ giúp
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
                    <path d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z" fill="currentColor" />
                  </svg>
                </button>

                <button className={styles.userMenuItem} onClick={handleLogout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor" />
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
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
            </svg>
            Nâng cấp lên Go
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.emptyState}>
            <h2 className={styles.greeting}>Chúng ta nên bắt đầu từ đâu?</h2>

            {/* PDF Thumbnails - Show in conversation area */}
            {pdfs.length > 0 && (
              <div className={styles.pdfThumbnails}>
                <h3 className={styles.pdfSectionTitle}>Bài giảng đã tạo</h3>
                <div className={styles.pdfGrid}>
                  {pdfs.map((pdf) => (
                    <PDFPreview
                      key={pdf.id}
                      pdfUrl={pdf.fileUrl}
                      fileName={pdf.fileName}
                      createdAt={pdf.createdAt}
                      conversationId={pdf.conversationId}
                      onDownload={() => console.log('Downloaded:', pdf.fileName)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.inputSection}>
          {/* Image Thumbnails Preview */}
          {uploadedImages.length > 0 && (
            <div className={styles.thumbnailContainer}>
              {uploadedImages.map((file, index) => (
                <div key={index} className={styles.thumbnail}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className={styles.thumbnailImage}
                  />
                  <button
                    className={styles.removeThumbnailBtn}
                    onClick={() => handleRemoveImage(index)}
                    title="Xóa ảnh"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div className={styles.thumbnailName}>{file.name}</div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.inputWrapper}>
            <div className={styles.addBtnWrapper} ref={uploadMenuRef}>
              <button className={styles.addBtn} onClick={handleAddButtonClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {uploadedImages.length > 0 && (
                  <span className={styles.uploadBadge}>{uploadedImages.length}</span>
                )}
              </button>

              {/* Upload Menu */}
              {showUploadMenu && (
                <div className={styles.uploadMenu}>
                  <button className={styles.uploadMenuItem} onClick={handleImageOptionClick}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Upload ảnh
                  </button>
                  <button className={styles.uploadMenuItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 1v4m0 14v4M1 12h4m14 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Chụp ảnh
                  </button>
                  <button className={styles.uploadMenuItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" stroke="currentColor" strokeWidth="2" />
                      <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Upload file
                  </button>
                </div>
              )}
            </div>

            <input
              type="text"
              className={styles.input}
              placeholder="Hỏi bất kỳ điều gì"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button className={styles.voiceBtn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 013 3v8a3 3 0 11-6 0V4a3 3 0 013-3z" stroke="currentColor" strokeWidth="2" />
                <path d="M19 10v2a7 7 0 11-14 0v-2M12 19v4m-4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!input.trim() && uploadedImages.length === 0}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M10 8l6 4-6 4V8z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
