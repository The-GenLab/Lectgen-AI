const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UpdateProfileData {
  name: string;
}

export const updateProfile = async (data: UpdateProfileData, accessToken: string) => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Include cookies for auth
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update profile');
  }

  return result;
};

export const getProfile = async (accessToken: string) => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to get profile');
  }

  return result;
};

export const uploadAvatar = async (file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_URL}/files/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Include cookies for auth
    body: formData,
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to upload avatar');
  }

  return result;
};
