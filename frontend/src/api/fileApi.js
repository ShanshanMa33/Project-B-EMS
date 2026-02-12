import { api } from "./client";

export const fetchFileBlob = (url) =>
    api.get(url, { responseType: "blob" });

