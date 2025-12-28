import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with cookie-based auth
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Include cookies for authentication
});

export interface AnalysisResult {
    traits: Array<{
        label: string;
        icon: string;
    }>;
    colors: string[];
    layoutType: string;
    colorScheme: string;
    dimensions: {
        width: number;
        height: number;
    };
}

export interface TemplateFile {
    id: string;
    userId: string;
    conversationId?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: 'image' | 'document';
    analyzed: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Upload template file (image or document) to backend (saves to MinIO + DB)
 */
export async function uploadTemplateImage(
    file: File,
    conversationId?: string
): Promise<TemplateFile> {
    const formData = new FormData();
    formData.append('file', file);

    if (conversationId) {
        formData.append('conversationId', conversationId);
    }

    const response = await api.post<{ success: boolean; data: TemplateFile | TemplateFile[] }>(
        '/template/upload',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    // Backend returns single object if 1 file, array if multiple
    const data = response.data.data;
    return Array.isArray(data) ? data[0] : data;
}

/**
 * Get user's template files (images and documents)
 */
export async function getTemplateImages(analyzed?: boolean): Promise<TemplateFile[]> {
    const params = analyzed !== undefined ? { analyzed } : {};
    const response = await api.get<{ success: boolean; data: TemplateFile[] }>(
        '/template',
        { params }
    );
    return response.data.data;
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<TemplateFile> {
    const response = await api.get<{ success: boolean; data: TemplateFile }>(
        `/template/${id}`
    );
    return response.data.data;
}

/**
 * Delete template file
 */
export async function deleteTemplateImage(id: string): Promise<void> {
    await api.delete(`/template/${id}`);
}

/**
 * Analyze template image style
 */
export async function analyzeTemplate(imageFile: File): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post<{ success: boolean; data: AnalysisResult }>(
        '/template/analyze',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data.data;
}
