import { useState, useRef, useEffect } from 'react';
import { Button, Input, Tag, message } from 'antd';
import { CheckCircleOutlined, PictureOutlined } from '@ant-design/icons';
import { analyzeTemplate } from '../../api/template';
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

interface AnalysisResult {
    traits: DetectedTrait[];
    colors: string[];
    layoutType: string;
    colorScheme: string;
    complexity?: any;
    visualMetrics?: any;
    dimensions?: {
        width: number;
        height: number;
    };
}

interface TemplateAnalyzerProps {
    onConfirm: (templateImage: File | null, topic: string, analysisResult: AnalysisResult | null) => void;
}

interface DetectedTrait {
    label: string;
    icon?: string;
}

// Template Analyzer Component for Image/Template Input tab
export function TemplateAnalyzer({ onConfirm }: TemplateAnalyzerProps) {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [topic, setTopic] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [detectedTraits, setDetectedTraits] = useState<DetectedTrait[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                message.error('Vui lòng chọn file ảnh!');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                message.error('Kích thước file không được vượt quá 10MB!');
                return;
            }

            setUploadedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            await analyzeStyle(file);
        }
    };

    const analyzeStyle = async (file: File) => {
        setIsAnalyzing(true);
        setIsAnalyzed(false);

        try {
            console.log('Analyzing template image...', file.name);
            const result = await analyzeTemplate(file);
            console.log('Analysis result:', result);
            setDetectedTraits(result.traits);
            setAnalysisResult(result); // Store full analysis result
            setIsAnalyzed(true);
            message.success('Phân tích style hoàn tất!');
        } catch (error: any) {
            console.error('Analysis error:', error);
            console.error('Error details:', error.response?.data);
            message.error(error.response?.data?.message || 'Không thể phân tích ảnh');
            // Fallback to mock data
            console.log('Using fallback mock data');
            setDetectedTraits([
                { label: 'Minimalist' },
                { label: 'Sans-Serif' },
                { label: '2-Column Grid' },
                { label: 'Blue & White' },
            ]);
            setIsAnalyzed(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRemoveImage = () => {
        setUploadedFile(null);
        setPreviewUrl('');
        setIsAnalyzed(false);
        setDetectedTraits([]);
        setAnalysisResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleConfirm = () => {
        if (!uploadedFile) {
            message.warning('Vui lòng upload ảnh template!');
            return;
        }
        if (!topic.trim()) {
            message.warning('Vui lòng nhập chủ đề bài thuyết trình!');
            return;
        }

        // Call parent callback
        onConfirm(uploadedFile, topic, analysisResult);

        // Reset form after confirm
        setUploadedFile(null);
        setPreviewUrl('');
        setTopic('');
        setIsAnalyzed(false);
        setDetectedTraits([]);
        setAnalysisResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={styles.analyzerContainer}>
            <div className={styles.analyzerContent}>
                <div className={styles.uploadSection}>
                    {!uploadedFile ? (
                        <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                            <div className={styles.uploadIcon}>
                                <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                            </div>
                            <div className={styles.uploadText}>
                                <p className={styles.uploadTitle}>Click to upload template image</p>
                                <p className={styles.uploadHint}>Support PNG, JPG, JPEG (max 10MB)</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className={styles.analysisContainer}>
                            <div className={styles.statusBadge}>
                                {isAnalyzing && <Tag color="processing">Đang phân tích...</Tag>}
                                {isAnalyzed && (
                                    <Tag icon={<CheckCircleOutlined />} color="success">
                                        Style Analysis Complete
                                    </Tag>
                                )}
                            </div>

                            <div className={styles.previewSection}>
                                <div className={styles.imagePreview}>
                                    <img src={previewUrl} alt="Template preview" />
                                    <div className={styles.uploadedBadge}>UPLOADED</div>
                                    <button className={styles.removeBtn} onClick={handleRemoveImage}>
                                        ×
                                    </button>
                                </div>

                                {isAnalyzed && (
                                    <div className={styles.detectedTraits}>
                                        <h4>DETECTED TRAITS</h4>
                                        <div className={styles.traitTags}>
                                            {detectedTraits.map((trait, index) => (
                                                <Tag key={index} className={styles.traitTag}>
                                                    {trait.icon && <span>{trait.icon}</span>}
                                                    {trait.label}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.topicSection}>
                    <label className={styles.topicLabel}>Presentation Topic</label>
                    <Input
                        size="large"
                        placeholder="e.g. Q3 Sales Performance Review"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className={styles.topicInput}
                    />
                </div>

                <div className={styles.actions}>
                    <Button onClick={handleRemoveImage} disabled={!uploadedFile}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleConfirm}
                        disabled={!uploadedFile || !topic.trim() || isAnalyzing}
                        icon={<CheckCircleOutlined />}
                        className={styles.confirmBtn}
                    >
                        Confirm & Generate
                    </Button>
                </div>
            </div>
        </div>
    );
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
