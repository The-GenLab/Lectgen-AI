import { useState, useRef, useEffect } from 'react';
import styles from './FileUploadPanel.module.css';

interface FileUploadPanelProps {
    uploadedImages: File[];
    uploadedFiles: File[];
    onRemoveImage: (index: number) => void;
    onRemoveFile: (index: number) => void;
}

interface UploadButtonProps {
    totalCount: number;
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Export button component separately for use in inputWrapper
export function UploadButton({ totalCount, onImageUpload, onFileUpload }: UploadButtonProps) {
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const uploadMenuRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddButtonClick = () => {
        setShowUploadMenu(!showUploadMenu);
    };

    const handleImageOptionClick = () => {
        imageInputRef.current?.click();
        setShowUploadMenu(false);
    };

    const handleFileOptionClick = () => {
        fileInputRef.current?.click();
        setShowUploadMenu(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
                setShowUploadMenu(false);
            }
        };

        if (showUploadMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUploadMenu]);

    return (
        <div className={styles.addBtnWrapper} ref={uploadMenuRef}>
            <button className={styles.addBtn} onClick={handleAddButtonClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {totalCount > 0 && (
                    <span className={styles.uploadBadge}>{totalCount}</span>
                )}
            </button>

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
                    <button className={styles.uploadMenuItem} onClick={handleFileOptionClick}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" stroke="currentColor" strokeWidth="2" />
                            <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Upload file
                    </button>
                </div>
            )}

            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={onImageUpload}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                style={{ display: 'none' }}
                onChange={onFileUpload}
            />
        </div>
    );
}

export default function FileUploadPanel({ uploadedImages, uploadedFiles, onRemoveImage, onRemoveFile }: FileUploadPanelProps) {
    return (
        <>
            {/* Thumbnails Preview - render outside inputWrapper */}
            {(uploadedImages.length > 0 || uploadedFiles.length > 0) && (
                <div className={styles.thumbnailContainer}>
                    {/* Image Thumbnails */}
                    {uploadedImages.map((file, index) => (
                        <div key={`image-${index}`} className={styles.thumbnail}>
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className={styles.thumbnailImage}
                            />
                            <button
                                className={styles.removeThumbnailBtn}
                                onClick={() => onRemoveImage(index)}
                                title="Xóa ảnh"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            <div className={styles.thumbnailName}>{file.name}</div>
                        </div>
                    ))}

                    {/* File Thumbnails */}
                    {uploadedFiles.map((file, index) => (
                        <div key={`file-${index}`} className={styles.thumbnail}>
                            <div className={styles.fileThumbnail}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <div className={styles.fileExt}>
                                    {file.name.split('.').pop()?.toUpperCase()}
                                </div>
                            </div>
                            <button
                                className={styles.removeThumbnailBtn}
                                onClick={() => onRemoveFile(index)}
                                title="Xóa file"
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
        </>
    );
}
