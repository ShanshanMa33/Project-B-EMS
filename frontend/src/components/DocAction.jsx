import React from "react";
import { Button, Space, message } from "antd";
import { useSelector } from "react-redux";

// A reusable component for previewing/downloading visa documents with auth
export default function DocAction({ previewUrl, downloadUrl }) {
    const token = useSelector((state) => state.auth.token);

    // Helper function to open preview/download links with auth
    async function openWithAuth(url, filename, isDownload = false) {
        try {
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error("Failed to load file");
            }

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            // For download, we create a temporary link and click it; for preview, we open in a new tab
            if (isDownload) {
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = filename || "document";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.open(blobUrl, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            console.error(err);
            message.error("Unable to load document.");
        }
    }

    return (
        <Space>
            <Button
                onClick={() =>
                    openWithAuth(previewUrl, null, false)
                }
            >
                Preview
            </Button>

            <Button
                onClick={() =>
                    openWithAuth(downloadUrl, "document", true)
                }
            >
                Download
            </Button>
        </Space>
    );
}
