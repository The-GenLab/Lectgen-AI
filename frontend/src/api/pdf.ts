import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface PDFDocument {
    id: string;
    conversationId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    createdAt: string;
    updatedAt: string;
}

export interface GeneratePDFRequest {
    conversationId: string;
    template?: 'basic' | 'premium';
    includeImages?: boolean;
}

export interface GeneratePDFResponse {
    success: boolean;
    data: PDFDocument;
    message?: string;
}

export const getUserPDFs = async (): Promise<PDFDocument[]> => {
    const response = await api.get('/pdf');
    return response.data.data;
};

export const getConversationPDFs = async (conversationId: string): Promise<PDFDocument[]> => {
    const response = await api.get(`/pdf/conversation/${conversationId}`);
    return response.data.data;
};

export const generatePDF = async (request: GeneratePDFRequest): Promise<GeneratePDFResponse> => {
    const response = await api.post('/pdf/generate', request);
    return response.data;
};

export const downloadPDF = async (pdfId: string): Promise<Blob> => {
    const response = await api.get(`/pdf/${pdfId}/download`, {
        responseType: 'blob',
    });
    return response.data;
};

export const deletePDF = async (pdfId: string): Promise<void> => {
    await api.delete(`/pdf/${pdfId}`);
};

export default {
    getUserPDFs,
    getConversationPDFs,
    generatePDF,
    downloadPDF,
    deletePDF,
};
