import { api } from "./client";

const HR_BASE = "/api/hr";

export const sendHRInvitation = (payload) =>
    api.post(`${HR_BASE}/invitation`, payload);

export const getHRTokenHistory = () => api.get(`${HR_BASE}/token-history`);

export const getHROnboardingList = () => api.get(`${HR_BASE}/onboarding/list`);
export const getHRApplications = getHROnboardingList;

export const getHRApplicationDetail = (userId) =>
    api.get(`${HR_BASE}/profiles/${userId}`);

export const getHRProfiles = ({ search = "", workAuth = "", page = 1, pageSize = 6 } = {}) =>
    api.get(`${HR_BASE}/profiles`, { params: { search, workAuth, page, pageSize } });

export const getHRVisaAll = () => api.get(`${HR_BASE}/visa/all`);
export const getHRVisaDistribution = () => api.get(`${HR_BASE}/visa/distribution`);

export const reviewHRApplication = (payload) =>
    api.put(`${HR_BASE}/onboarding/review`, payload);

export const sendHRVisaNotification = (payload) =>
    api.post(`${HR_BASE}/visa/notify`, payload);

export const reviewHRVisaDocument = (payload) =>
    api.put(`${HR_BASE}/visa/review`, payload);

export const previewHROnboardingDocument = (userId, docId) =>
    api.get(`${HR_BASE}/onboarding-documents/${userId}/${docId}/preview`, { responseType: "blob" });

export const downloadHROnboardingDocument = (userId, docId) =>
    api.get(`${HR_BASE}/onboarding-documents/${userId}/${docId}/download`, { responseType: "blob" });

export const previewHRVisaDocument = (userId, docId) =>
    api.get(`${HR_BASE}/visa-documents/${userId}/${docId}/preview`, { responseType: "blob" });

export const downloadHRVisaDocument = (userId, docId) =>
    api.get(`${HR_BASE}/visa-documents/${userId}/${docId}/download`, { responseType: "blob" });

export const previewHRProfileDocument = (userId, docKey) =>
    api.get(`${HR_BASE}/documents/${userId}/${docKey}/preview`, { responseType: "blob" });

export const downloadHRProfileDocument = (userId, docKey) =>
    api.get(`${HR_BASE}/documents/${userId}/${docKey}/download`, { responseType: "blob" });

// Backward-compatible URL builders used by some existing components.
export const getHRDocumentPreviewUrl = (userId, docKey) =>
    `${api.defaults.baseURL}${HR_BASE}/documents/${userId}/${docKey}/preview`;

export const getHRDocumentDownloadUrl = (userId, docKey) =>
    `${api.defaults.baseURL}${HR_BASE}/documents/${userId}/${docKey}/download`;

export const getHRVisaDocumentPreviewUrl = (userId, docId) =>
    `${api.defaults.baseURL}${HR_BASE}/visa-documents/${userId}/${docId}/preview`;

export const getHRVisaDocumentDownloadUrl = (userId, docId) =>
    `${api.defaults.baseURL}${HR_BASE}/visa-documents/${userId}/${docId}/download`;

export const getHROnboardingDocumentPreviewUrl = (userId, docId) =>
    `${api.defaults.baseURL}${HR_BASE}/onboarding-documents/${userId}/${docId}/preview`;

export const getHROnboardingDocumentDownloadUrl = (userId, docId) =>
    `${api.defaults.baseURL}${HR_BASE}/onboarding-documents/${userId}/${docId}/download`;
