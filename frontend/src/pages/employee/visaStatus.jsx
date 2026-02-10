import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, Card, CardContent, Divider, Grid, Typography } from "@mui/material";

import VisaDocUploader from "../../components/Employee/VisaDocUploader";
import { fetchVisaCases, uploadVisaDocument, clearVisaState } from "../../store/visaSlice";

import VisaCurrentStatusCard from "../../components/Employee/VisaCurrentStatusCard";
import VisaApplicationTrack from "../../components/Employee/VisaApplicationTrack";

// What docs you want to show (UI order)
const STAGES = [
    { docType: "OPT_RECEIPT", label: "OPT Receipt", trackTitle: "OPT Receipt Uploaded" },
    { docType: "OPT_EAD", label: "OPT EAD", trackTitle: "OPT EAD Uploaded" },
    { docType: "I-983", label: "I-983", trackTitle: "I-983 Uploaded" },
    { docType: "I-20", label: "I-20", trackTitle: "I-20 Uploaded" },
];

export default function VisaStatus() {
    const dispatch = useDispatch();

    // ✅ matches your visaSlice initialState
    const { visaCase, loading, error, message } = useSelector((state) => state.visa);

    // track which doc is uploading (so we can disable only that button)
    const [uploadingDocType, setUploadingDocType] = useState(null);

    useEffect(() => {
        dispatch(fetchVisaCases());

        return () => {
            dispatch(clearVisaState());
        };
    }, [dispatch]);

    const docsMap = useMemo(() => {
        const arr = visaCase?.documents || [];
        const map = {};
        for (const doc of arr) map[doc.docType] = doc;
        return map;
    }, [visaCase]);

    const handleFileUpload = async (docType, file) => {
        if (!visaCase) return; // no case yet
        if (!file) return;

        try {
            setUploadingDocType(docType);

            // ✅ matches your thunk signature: ({ docType, fileName })
            // (fileName is actually a File object in your code)
            await dispatch(uploadVisaDocument({ docType, file })).unwrap();

            // refresh the newest case/doc list
            dispatch(fetchVisaCases());
        } finally {
            setUploadingDocType(null);
        }
    };

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a" }}>
                    Visa Status
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Upload required documents and track your case steps.
                </Typography>
            </Box>

            {!!error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!!message && !error && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {message}
                </Alert>
            )}

            <Grid container spacing={2}>
                {/* LEFT: Case Steps */}
                <Grid item xs={12} lg={7}>
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <VisaCurrentStatusCard stages={STAGES} docsMap={docsMap} />

                        <VisaApplicationTrack
                            stages={STAGES}
                            docsMap={docsMap}
                            onView={(doc) => {
                                // Phase 1: just open file in a new tab once you have preview endpoint wired
                                // later we can call /api/visa/me/documents/:docId/preview
                                console.log("view doc", doc);
                            }}
                        />
                    </Box>
                </Grid>

                {/* RIGHT: Document Uploads */}
                <Grid item xs={12} lg={5}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: "#0f172a", mb: 1 }}>
                                Document Uploads
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                                Upload PDFs or images. Each doc type is tracked separately.
                            </Typography>

                            <Box sx={{ display: "grid", gap: 1.2 }}>
                                {STAGES.map((d) => {
                                    const existing = docsMap[d.docType];
                                    const isUploadingThis = uploadingDocType === d.docType;

                                    return (
                                        <Box
                                            key={d.docType}
                                            sx={{
                                                p: 1.25,
                                                borderRadius: 2,
                                                bgcolor: "#f8fafc",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                                        {d.label}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                                                        {existing?.filename || existing?.originalName || "No file uploaded"}
                                                    </Typography>
                                                </Box>

                                                <VisaDocUploader
                                                    label={isUploadingThis ? "Uploading..." : "Upload"}
                                                    disabled={!visaCase || loading || isUploadingThis}
                                                    onFileUpload={(file) => handleFileUpload(d.docType, file)}
                                                />
                                            </Box>

                                            <Divider sx={{ my: 1 }} />

                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" sx={{ color: "#64748b" }}>
                                                    Status:{" "}
                                                    <span style={{ fontWeight: 800, color: "#0f172a" }}>
                                                        {(existing?.status || "not_uploaded").toString().replaceAll("_", " ")}
                                                    </span>
                                                </Typography>

                                                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                                    {d.docType}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>


                            {!visaCase && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Upload is disabled because your visa case hasn’t been created yet.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
