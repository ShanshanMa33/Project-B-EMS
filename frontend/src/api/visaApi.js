import { api } from "./client";

const VISA_BASE = "/api/visa/me";

export const getMyVisaCase = () => api.get(VISA_BASE);

export const uploadVisaDocumentApi = ({ docType, file }) => {
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("file", file);
    return api.post(`${VISA_BASE}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const previewMyVisaDocument = (docId) =>
    api.get(`${VISA_BASE}/documents/${docId}/preview`, { responseType: "blob" });

export const downloadMyVisaDocument = (docId) =>
    api.get(`${VISA_BASE}/documents/${docId}/download`, { responseType: "blob" });

