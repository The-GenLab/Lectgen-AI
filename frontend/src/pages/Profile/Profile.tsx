import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';
import { getCurrentUser } from '../../utils/auth';
import { getAvatarUrl } from '../../utils/file';
import * as userApi from '../../api/user';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Path từ DB
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // Preview khi chọn ảnh mới
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.email?.split('@')[0] || '');
      setAvatarUrl(currentUser.avatarUrl || null);
      setAvatarPreview(null); // Reset preview
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Chỉ chấp nhận file ảnh');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setAvatarFile(file);
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Tên hiển thị không được để trống');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Upload avatar if changed
      let newAvatarUrl = currentUser.avatarUrl;
      if (avatarFile) {
        const avatarResponse = await userApi.uploadAvatar(avatarFile);
        if (avatarResponse.success) {
          newAvatarUrl = avatarResponse.data.avatarUrl;
        }
      }

      // Update profile name
      const response = await userApi.updateProfile({ name: name.trim() });
      
      if (response.success) {
        // Update localStorage
        const updatedUser = { ...currentUser, name: name.trim(), avatarUrl: newAvatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccessMessage('Đã lưu thay đổi');
        
        // Redirect back to dashboard after 1 second
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const getInitials = () => {
    const displayName = name.trim() || username;
    if (!displayName) return 'U';
    
    const words = displayName.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      // Lấy chữ cái đầu của từ đầu và từ cuối
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.container}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Chỉnh sửa hồ sơ</h2>

        <div className={styles.avatarSection}>
          {(avatarPreview || getAvatarUrl(avatarUrl)) ? (
            <img src={avatarPreview || getAvatarUrl(avatarUrl)!} alt="Avatar" className={styles.avatarImage} />
          ) : (
            <div className={styles.avatar}>
              {getInitials()}
            </div>
          )}
          <label htmlFor="avatar-upload" className={styles.avatarButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tên hiển thị</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên hiển thị"
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tên người dùng</label>
          <input
            type="text"
            className={styles.input}
            value={username}
            disabled
            readOnly
          />
        </div>

        <p className={styles.helperText}>
          Hồ sơ của bạn giúp người khác nhận ra bạn. Tên và tên người dùng của bạn cũng được sử dụng trong ứng dụng Sora.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
