import React from "react";
import { Button, Space } from "antd";

export default function DocActions({ docId }) {
    const previewUrl = `/api/visa/me/documents/${docId}/preview`;
    const downloadUrl = `/api/visa/me/documents/${docId}/download`;

    return (
        <Space>
            <Button onClick={() => window.open(previewUrl, "_blank")}>Preview</Button>
            <Button onClick={() => window.open(downloadUrl, "_blank")}>Download</Button>
        </Space>
    );
}
