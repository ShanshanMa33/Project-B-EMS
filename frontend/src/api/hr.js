import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/hr';

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const sendHRInvitation = (data) => {
    return axios.post(`${API_BASE}/invitation`, data, {
        headers: authHeaders(),
    });
};

export const getHRApplications = () => {
    return axios.get(`${API_BASE}/onboarding/all`, {
        headers: authHeaders(),
    });
};

export const getHRApplicationDetail = (userId) => {
    return axios.get(`${API_BASE}/onboarding/${userId}`, {
        headers: authHeaders(),
    });
};

export const getHRProfiles = (search = '') => {
    return axios.get(`${API_BASE}/profiles`, {
        params: { search },
        headers: authHeaders(),
    });
};

export const getHRVisaAll = () => {
    return axios.get(`${API_BASE}/visa/all`, {
        headers: authHeaders(),
    });
};

export const reviewHRApplication = (payload) => {
    return axios.put(`${API_BASE}/onboarding/review`, payload, {
        headers: authHeaders(),
    });
};

export const sendHRVisaNotification = (payload) => {
    return axios.post(`${API_BASE}/visa/notify`, payload, {
        headers: authHeaders(),
    });
};
