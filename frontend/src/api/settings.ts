import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface InputMethods {
    text: boolean;
    audio: boolean;
    image: boolean;
}

/**
 * Get enabled input methods (public endpoint, no auth required)
 * Used to show/hide input options in the UI
 */
export const getInputMethods = async (): Promise<InputMethods> => {
    const response = await axios.get(`${API_BASE_URL}/settings/input-methods`);
    return response.data.data;
};

/**
 * Get maintenance mode status (public endpoint, no auth required)
 * Used to check if system is under maintenance
 */
export const getMaintenanceMode = async (): Promise<boolean> => {
    const response = await axios.get(`${API_BASE_URL}/settings/maintenance`);
    return response.data.data.maintenanceMode;
};

