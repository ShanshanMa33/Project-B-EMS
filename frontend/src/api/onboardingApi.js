import { api } from "./client";

const ONBOARDING_BASE = "/api/onboarding";

export const getMyOnboarding = () => api.get(ONBOARDING_BASE);

export const createMyOnboarding = () => api.post(ONBOARDING_BASE, {});

export const updateMyOnboarding = (payload) =>
    api.put(ONBOARDING_BASE, payload);

export const submitMyOnboarding = () =>
    api.put(ONBOARDING_BASE, { action: "submit" });

export const uploadOnboardingDocument = ({ docType, file }) => {
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("file", file);
    return api.post(`${ONBOARDING_BASE}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const deleteOnboardingDocument = (docId) =>
    api.delete(`${ONBOARDING_BASE}/documents/${docId}`);

export const previewOnboardingDocument = (docId) =>
    api.get(`${ONBOARDING_BASE}/documents/${docId}/preview`, { responseType: "blob" });

export const downloadOnboardingDocument = (docId) =>
    api.get(`${ONBOARDING_BASE}/documents/${docId}`, { responseType: "blob" });

