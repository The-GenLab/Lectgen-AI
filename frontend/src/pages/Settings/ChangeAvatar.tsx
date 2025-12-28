import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAvatar, getProfile } from '../../api/user';
import { getAvatarUrl } from '../../utils/file';
import { getCurrentUser } from '../../utils/auth';
import { message } from 'antd';

const ChangeAvatar: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(33); // 0-100 scale

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await getProfile();
        if (response.success && response.data?.user) {
          setCurrentUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          const user = getCurrentUser();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        const user = getCurrentUser();
        setCurrentUser(user);
      }
    };

    loadUserData();
  }, []);

  const getUserDisplayName = () => {
    if (!currentUser) return 'User';
    if (currentUser.name) return currentUser.name;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const words = displayName.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const getUserEmail = () => {
    if (!currentUser?.email) return '';
    const username = currentUser.email.split('@')[0];
    return `@${username}_lect`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|svg|webp)$/)) {
        message.error('Invalid file type. Only SVG, PNG, JPG, GIF, or WebP images are allowed.');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('File size exceeds 5MB limit.');
        return;
      }

      setAvatarFile(file);
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!avatarFile) {
      message.warning('Please select an image file first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await uploadAvatar(avatarFile);
      if (response.success) {
        // Update local storage
        const updatedUser = { ...currentUser, avatarUrl: response.data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        message.success('Avatar updated successfully!');
        
        // Reload page to reflect changes in sidebar
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        message.error(response.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const currentAvatarUrl = currentUser?.avatarUrl ? getAvatarUrl(currentUser.avatarUrl) : null;
  const displayAvatar = avatarPreview || currentAvatarUrl;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden">
      {/* TopNavBar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 lg:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
            <div className="size-6 text-primary">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">LectGen-AI</h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>Dashboard</a>
            <a className="hover:text-primary transition-colors cursor-pointer" href="#">My Slides</a>
            <a className="text-primary cursor-pointer" onClick={() => navigate('/settings')}>Settings</a>
          </nav>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
          <div className="flex gap-2">
            <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
            <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
          </div>
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border-2 border-white dark:border-slate-800 shadow-sm cursor-pointer" 
            style={currentAvatarUrl ? { backgroundImage: `url("${currentAvatarUrl}")` } : { backgroundColor: '#136dec', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}
            onClick={() => navigate('/settings')}
          >
            {!currentAvatarUrl && getUserInitials()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4 md:px-8">
        <div className="w-full max-w-[800px] flex flex-col gap-6">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigate('/')}>Settings</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-slate-900 dark:text-white font-medium">Profile</span>
            </nav>
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Change Avatar</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Update your profile picture to personalize your LectGen-AI experience.</p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col gap-8">
              {/* Top Section: Current & Upload Option */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Current Avatar Preview */}
                <div className="flex flex-col gap-4 items-center md:items-start min-w-[180px]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Current</span>
                  <div className="relative group cursor-pointer">
                    <div 
                      className="size-32 rounded-full bg-slate-100 dark:bg-slate-800 bg-center bg-cover border-4 border-white dark:border-slate-800 shadow-lg"
                      style={displayAvatar ? { backgroundImage: `url("${displayAvatar}")` } : { backgroundColor: '#136dec', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}
                    >
                      {!displayAvatar && getUserInitials()}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">edit</span>
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="font-bold text-slate-900 dark:text-white">{getUserDisplayName()}</p>
                    <p className="text-sm text-slate-500">{getUserEmail()}</p>
                  </div>
                </div>

                {/* Upload Area (Dashed) */}
                <div className="flex-1 w-full">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-4">Upload New</span>
                  <label className="relative group/upload flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer px-6 py-10 h-full min-h-[220px]">
                    <input 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      type="file"
                      accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleFileChange}
                    />
                    <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/upload:text-primary group-hover/upload:bg-white group-hover/upload:shadow-md transition-all">
                      <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-slate-900 dark:text-white font-medium group-hover/upload:text-primary transition-colors">Click to upload or drag and drop</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                    <button 
                      type="button"
                      className="mt-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      Select File
                    </button>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

              {/* Crop & Zoom Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">crop</span>
                    Edit & Preview
                  </h3>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {avatarFile ? 'File selected' : 'No file selected'}
                  </span>
                </div>

                {/* Crop Visualizer */}
                <div className={`bg-slate-50 dark:bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 transition-all duration-500 ${avatarFile ? 'opacity-100 grayscale-0' : 'opacity-60 grayscale'}`}>
                  {avatarPreview ? (
                    <>
                      <div className="relative size-64 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${avatarPreview}")`,
                            transform: `scale(${1 + zoom / 100})`,
                            transition: 'transform 0.3s ease'
                          }}
                        ></div>
                        {/* Circular Mask Overlay */}
                        <div className="absolute inset-0 bg-slate-900/50 mix-blend-hard-light"></div>
                        <div className="relative z-10 size-48 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"></div>
                      </div>
                      {/* Slider Component */}
                      <div className="w-full max-w-sm flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400 text-[20px] cursor-pointer" onClick={() => setZoom(Math.max(0, zoom - 10))}>remove</span>
                        <div className="relative flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer group/slider">
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-primary rounded-full transition-all"
                            style={{ width: `${zoom}%` }}
                          ></div>
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 size-4 bg-white border-2 border-primary rounded-full shadow-md group-hover/slider:scale-110 transition-transform cursor-grab active:cursor-grabbing"
                            style={{ left: `calc(${zoom}% - 8px)` }}
                            onMouseDown={(e) => {
                              const slider = e.currentTarget.parentElement;
                              if (!slider) return;
                              const handleMove = (e: MouseEvent) => {
                                const rect = slider.getBoundingClientRect();
                                const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                                setZoom(percent);
                              };
                              const handleUp = () => {
                                document.removeEventListener('mousemove', handleMove);
                                document.removeEventListener('mouseup', handleUp);
                              };
                              document.addEventListener('mousemove', handleMove);
                              document.addEventListener('mouseup', handleUp);
                            }}
                          ></div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 text-[20px] cursor-pointer" onClick={() => setZoom(Math.min(100, zoom + 10))}>add</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Zoom</p>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-slate-400 text-[48px] mb-4 block">image</span>
                      <p className="text-slate-400 text-sm">Upload an image to preview and crop</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 dark:bg-slate-950/50 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={isLoading || !avatarFile}
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-center text-sm text-slate-400">
            Need help? <a className="text-primary hover:underline cursor-pointer" href="#">Read our documentation</a> on profile images.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChangeAvatar;

