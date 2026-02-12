import { api } from "../api/client";

/**
 * Fetch a secured file via axios (Bearer token attached),
 * then either preview it in a new tab or download it.
 */
export async function fetchAndHandleDoc({
    url,
    mode, // "preview" | "download"
    filename = "download",
}) {
    const res = await api.get(url, { responseType: "blob" });

    const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "application/octet-stream",
    });

    const blobUrl = window.URL.createObjectURL(blob);

    if (mode === "preview") {
        // open in new tab
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        // revoke later so the new tab can load it
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
        return;
    }

    // download
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
}
