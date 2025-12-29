import { useState } from 'react';
import styles from './PDFPreview.module.css';

interface PDFPreviewProps {
  pdfUrl: string;
  fileName: string;
  createdAt: string;
  conversationId: string;
  onDownload?: () => void;
}

export default function PDFPreview({ 
  pdfUrl, 
  fileName, 
  createdAt, 
  conversationId,
  onDownload 
}: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Cannot load PDF file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `lecture-${conversationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (onDownload) onDownload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading file');
      console.error('Download error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={styles.pdfPreview}>
      <div className={styles.thumbnail}>
        {/* PDF icon as thumbnail */}
        <svg viewBox="0 0 24 24" fill="none" className={styles.pdfIcon}>
          <path 
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M14 2v6h6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <text x="12" y="17" textAnchor="middle" fontSize="5" fill="currentColor">PDF</text>
        </svg>
      </div>
      
      <div className={styles.info}>
        <div className={styles.fileName} title={fileName}>
          {fileName || `lecture-${conversationId}.pdf`}
        </div>
        <div className={styles.metadata}>
          <span className={styles.date}>{formatDate(createdAt)}</span>
        </div>
      </div>
      
      <div className={styles.actions}>
        <button 
          onClick={handleDownload}
          disabled={isLoading}
          className={styles.downloadBtn}
          title="Tải xuống PDF"
        >
          {isLoading ? (
            <svg className={styles.spinner} viewBox="0 0 24 24">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none"
                strokeDasharray="32"
                strokeDashoffset="32"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path 
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <polyline 
                points="7 10 12 15 17 10" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <line 
                x1="12" 
                y1="15" 
                x2="12" 
                y2="3" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}
