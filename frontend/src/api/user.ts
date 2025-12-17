const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UpdateProfileData {
  name: string;
}

export const updateProfile = async (data: UpdateProfileData) => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
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

export const getProfile = async () => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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
    credentials: 'include', // Include cookies for auth
    body: formData,
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to upload avatar');
  }

  return result;
};
