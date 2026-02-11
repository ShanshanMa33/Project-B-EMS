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

export const getHRInvitationHistory = () => {
    return axios.get(`${API_BASE}/invitation-history`, {
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

export const getHRProfiles = ({ search = '', workAuth = '', page = 1, pageSize = 6 } = {}) => {
    return axios.get(`${API_BASE}/profiles`, {
        params: { search, workAuth, page, pageSize },
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

export const reviewHRVisaDocument = (payload) => {
    return axios.put(`${API_BASE}/visa/review`, payload, {
        headers: authHeaders(),
    });
};

export const getHRDocumentPreviewUrl = (userId, docKey) =>
    `${API_BASE}/documents/${userId}/${docKey}/preview`;

export const getHRDocumentDownloadUrl = (userId, docKey) =>
    `${API_BASE}/documents/${userId}/${docKey}/download`;

export const getHRVisaDocumentPreviewUrl = (userId, docId) =>
    `${API_BASE}/visa-documents/${userId}/${docId}/preview`;

export const getHRVisaDocumentDownloadUrl = (userId, docId) =>
    `${API_BASE}/visa-documents/${userId}/${docId}/download`;
