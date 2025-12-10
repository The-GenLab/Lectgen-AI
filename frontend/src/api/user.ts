import { getAuthHeaders, getAuthHeadersForUpload } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UpdateProfileData {
  name: string;
}

export const updateProfile = async (data: UpdateProfileData) => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update profile');
  }

  return result;
};

export const getProfile = async () => {
  const response = await fetch(`${API_URL}/users/profile`, {
    headers: getAuthHeaders(),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to get profile');
  }

  return result;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_URL}/files/avatar`, {
    method: 'POST',
    headers: {
      ...getAuthHeadersForUpload(), // Don't set Content-Type, let browser set multipart/form-data
    },
    body: formData,
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to upload avatar');
  }

  return result;
};
