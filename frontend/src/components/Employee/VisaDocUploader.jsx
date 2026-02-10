import React from "react";
import { Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function VisaDocUploader({ onFileUpload, disabled, label }) {
    return (
        <Upload
            beforeUpload={(file) => {
                onFileUpload(file);
                return false; //stop auto upload
            }}
            showUploadList={false}
            disabled={disabled}
            accept=".pdf,.jpg,.jpeg,.png"
        >
            <Button icon={<UploadOutlined />} disabled={disabled}>
                {label}
            </Button>
        </Upload>
    )
}