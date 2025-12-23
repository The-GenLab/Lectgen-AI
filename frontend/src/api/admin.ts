import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
}

export interface UserWithStats {
    id: string;
    email: string;
    name: string;
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
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
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
