import React, { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { uploadVisaDocumentApi } from "../../api/visaApi";
import { fetchVisaCases } from "../../store/visaSlice";

export default function VisaDocUploader({
    docType,
    label = "Upload / Re-upload",
    disabled = false,
    currentStatus,
    rejectionReason,
    onUploaded,
}) {
    const dispatch = useDispatch();
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
            await uploadVisaDocumentApi({ docType, file: fileObj });
            await dispatch(fetchVisaCases()).unwrap();
            dispatch({ type: "hr/invalidateVisaRows" });

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
