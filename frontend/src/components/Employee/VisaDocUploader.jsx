import React, { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { api } from "../../api/client";

export default function VisaDocUploader({
    docType,
    label = "Upload / Re-upload",
    disabled = false,
    currentStatus,
    rejectionReason,
    onUploaded,
    uploadUrl = "/api/visa/me/documents",
}) {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    const uploadProps = useMemo(
        () => ({
            fileList,
            beforeUpload: () => false,
            onChange: ({ fileList: next }) => setFileList(next.slice(-1)),
            maxCount: 1,
        }),
        [fileList]
    );

    const doUpload = async () => {
        const fileObj = fileList[0]?.originFileObj;
        if (!fileObj || !docType) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("docType", docType);
            formData.append("file", fileObj);

            await api.post(uploadUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            message.success("Document uploaded.");
            setFileList([]);
            if (onUploaded) onUploaded();
        } catch (err) {
            const msg = err?.response?.data?.message || "Upload failed.";
            message.error(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            {currentStatus && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Status: {currentStatus}
                </Typography>
            )}
            {rejectionReason && (
                <Typography variant="body2" color="error" sx={{ mb: 0.5 }}>
                    Rejected: {rejectionReason}
                </Typography>
            )}

            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Upload {...uploadProps} disabled={disabled}>
                    <Button icon={<UploadOutlined />} disabled={disabled}>
                        Choose file
                    </Button>
                </Upload>
                <Button
                    type="primary"
                    onClick={doUpload}
                    disabled={disabled || !fileList?.length}
                    loading={uploading}
                >
                    {label}
                </Button>
            </Box>
        </Box>
    );
}
