import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

    const response = await api.post<{ success: boolean; data: TemplateFile }>(
        '/template/upload',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data.data;
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
