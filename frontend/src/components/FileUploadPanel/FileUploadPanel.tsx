import { useState, useRef } from 'react';
import { Button, Input, Tag, message } from 'antd';
import { CheckCircleOutlined, PictureOutlined } from '@ant-design/icons';
import { analyzeTemplate } from '../../api/template';
import styles from './FileUploadPanel.module.css';

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
