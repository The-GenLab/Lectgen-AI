import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

// Admin Stats API
export interface GlobalStats {
    totalUsers: number;
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
    byActionType: { [key: string]: number };
    usersByRole: {
        FREE: number;
        VIP: number;
        ADMIN: number;
    };
    comparison?: {
        tokenChange: number;
        slidesChange?: number;
        freeUserGrowth: number;
        vipRetention: number;
    };
    quotaStatus?: Array<{
        userName: string;
        used: number;
        limit: number;
        usagePercent: number;
    }>;
    vipMetrics?: {
        activeVipUsers: number;
        vipGenerationsToday: number;
        avgResponseTime: number;
        systemLoad: number;
    };
    // number of unique users active in the selected range grouped by role
    activeUsersByRole?: {
        FREE: number;
        VIP: number;
        ADMIN: number;
    };
}

export interface UserWithStats {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    role: string;
    slidesGenerated: number;
    maxSlidesPerMonth: number;
    subscriptionExpiresAt: string | null;
    createdAt: string;
    stats: {
        totalCalls: number;
        totalTokens: number;
        totalCost: number;
        successRate: number;
    };
}

export interface UsageLog {
    id: string;
    userId: string;
    actionType: string;
    tokensUsed: number | null;
    durationMs: number | null;
    cost: number | null;
    status: string;
    errorMessage: string | null;
    metadata: any;
    createdAt: string;
    level?: 'info' | 'warning' | 'error' | string;
}

/**
 * Get global system statistics
 */
export const getGlobalStats = async (params?: {
    startDate?: string;
    endDate?: string;
}): Promise<GlobalStats> => {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, { params });
    return response.data.data;
};

/**
 * Get all users with their stats
 */
export const getAllUsers = async (params?: {
    limit?: number;
    offset?: number;
}): Promise<{ users: UserWithStats[]; total: number }> => {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, { params });
    return response.data.data;
};

/**
 * Get detailed stats for a specific user
 */
export const getUserStats = async (
    userId: string,
    params?: { startDate?: string; endDate?: string }
) => {
    const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}/stats`, { params });
    return response.data.data;
};

/**
 * Get usage logs with filters
 */
export const getUsageLogs = async (params?: {
    userId?: string;
    actionType?: string;
    status?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}): Promise<{ rows: UsageLog[]; count: number }> => {
    const response = await axios.get(`${API_BASE_URL}/admin/usage-logs`, { params });
    return response.data.data;
};

/**
 * Update user quota
 */
export const updateUserQuota = async (
    userId: string,
    maxSlidesPerMonth: number
): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/admin/users/${userId}/quota`, { maxSlidesPerMonth });
};

/**
 * Update user role
 */
export const updateUserRole = async (userId: string, role: string): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/admin/users/${userId}/role`, { role });
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/users/${userId}`);
};

/**
 * Reset user password (admin only)
 */
export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/admin/users/${userId}/reset-password`, { newPassword });
};

/**
 * Upload avatar for user (admin only)
 */
export const uploadUserAvatar = async (userId: string, file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axios.post(`${API_BASE_URL}/admin/users/${userId}/avatar`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.data;
};

/**
 * System Settings API
 */
export interface SystemConfig {
    monthlyFreeQuota: number;
    inputMethods: {
        text: boolean;
        audio: boolean;
        image: boolean;
    };
    vipConfig: {
        priorityQueue: boolean;
        processingMultiplier: number;
    };
    maintenanceMode: boolean;
}

/**
 * Get system settings
 */
export const getSystemSettings = async (): Promise<SystemConfig> => {
    const response = await axios.get(`${API_BASE_URL}/admin/settings`);
    return response.data.data;
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (updates: Partial<SystemConfig>): Promise<SystemConfig> => {
    const response = await axios.patch(`${API_BASE_URL}/admin/settings`, updates);
    return response.data.data;
};

/**
 * Create new user (Admin only)
 */
export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: 'FREE' | 'VIP' | 'ADMIN';
}

export const createUser = async (data: CreateUserRequest): Promise<UserWithStats> => {
    const response = await axios.post(`${API_BASE_URL}/admin/users`, data);
    return response.data.data;
};