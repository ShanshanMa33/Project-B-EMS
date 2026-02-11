import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { fetchOnboarding } from "../../store/onboardingSlice";

import VisaDocUploader from "../../components/Employee/VisaDocUploader";
import { fetchVisaCases } from "../../store/visaSlice";

const DOCS = [
    { key: "OPT_RECEIPT", label: "OPT Receipt" },
    { key: "OPT_EAD", label: "OPT EAD" },
    { key: "I-983", label: "I-983 Form" },
    { key: "I-20", label: "I-20 Form" },
];

const STATUS_MESSAGES = {
    OPT_RECEIPT: {
        pending: "Waiting for HR to approve your OPT Receipt.",
        approved: "Please upload a copy of your OPT EAD.",
        rejected: "Your OPT Receipt was rejected.",
    },
    OPT_EAD: {
        pending: "Waiting for HR to approve your OPT EAD.",
        approved: "Please download and fill out the I-983 form.",
        rejected: "Your OPT EAD was rejected.",
    },
    "I-983": {
        pending: "Waiting for HR to approve and sign your I-983.",
        approved: "Please send the I-983 along with all necessary documents to your school and upload the new I-20.",
        rejected: "Your I-983 was rejected.",
    },
    "I-20": {
        pending: "Waiting for HR to approve your I-20.",
        approved: "All documents have been approved.",
        rejected: "Your I-20 was rejected.",
    },
};

function getNextDocKey(documents = []) {
    for (const d of DOCS) {
        const found = documents.find((x) => x.docType === d.key);
        if (!found) return d.key;
        if (found.status !== "approved") return d.key; // pending or rejected
    }
    return null;
}

export default function VisaStatus() {
    const dispatch = useDispatch();

    const { application, loading: onboardingLoading, error: onboardingError } =
        useSelector((s) => s.onboarding);

    //be defensive: some slices use visaCases (array), some use visaCase (object)
    const {
        visaCase,
        visaCases,
        loading: visaLoading,
        error: visaError,
    } = useSelector((s) => s.visa);


    useEffect(() => {
        if (!application && !onboardingLoading) {
            dispatch(fetchOnboarding());
        }
    }, [dispatch, application, onboardingLoading]);

    useEffect(() => {
        dispatch(fetchVisaCases());
    }, [dispatch]);

    //unify visa data safely
    const visaCas = useMemo(() => {
        const data = visaCase ?? visaCases ?? null;
        if (!data) return null;
        return Array.isArray(data) ? data[0] ?? null : data;
    }, [visaCase, visaCases]);

    const visaType = application?.workAuth?.visaType || "";
    const isF1 = visaType === "F1(CPT/OPT)";

    const documents = visaCas?.documents || [];

    const docsByType = useMemo(() => {
        return documents.reduce((acc, doc) => {
            acc[doc.docType] = doc;
            return acc;
        }, {});
    }, [documents]);

    const getDocStatus = (docType) => docsByType[docType]?.status || "missing";
    const getDocName = (docType) => docsByType[docType]?.originalName || docsByType[docType]?.storedName || "";

    const canUploadDoc = (docKey) => {
        const index = DOCS.findIndex((d) => d.key === docKey);
        if (index === -1) return false;

        const currentStatus = getDocStatus(docKey);
        if (currentStatus === "pending") return false;
        if (currentStatus === "approved") return false;

        if (index === 0) return true; // OPT Receipt
        const prevKey = DOCS[index - 1].key;
        return getDocStatus(prevKey) === "approved";
    };

    const renderStatusAlert = (docKey) => {
        const status = getDocStatus(docKey);
        if (status === "missing") return null;

        const feedback = docsByType[docKey]?.feedback;
        const msg = STATUS_MESSAGES[docKey]?.[status];
        if (!msg) return null;

        if (status === "rejected") {
            return (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {msg} Please check below HR's feedback and reload your file. {feedback ? `HR feedback: ${feedback}` : null}
                </Alert>
            );
        }

        return (
            <Alert severity={status === "approved" ? "success" : "info"} sx={{ mb: 1 }}>
                {msg}
            </Alert>
        );
    };

    const renderStatusButton = (docKey) => {
        const status = getDocStatus(docKey);
        if (status === "missing") return null;

        const label = status.charAt(0).toUpperCase() + status.slice(1);
        const color = status === "approved" ? "success" : status === "rejected" ? "error" : "info";

        return (
            <Button variant="outlined" color={color} size="small">
                {label}
            </Button>
        );
    };

    const nextDocKey = getNextDocKey(documents);
    const nextLabel = DOCS.find((d) => d.key === nextDocKey)?.label;

    // ✅ render loading UI instead of returning before hooks
    if (onboardingLoading && !application) {
        return (
            <Box>
                <Alert severity="info">Loading your onboarding info...</Alert>
            </Box>
        );
    }

    return (
        <Box>
            {onboardingError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {String(onboardingError)}
                </Alert>
            )}

            {/* If you want to hide upload UI for non-F1, turn this back on */}
            {!isF1 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Your visa type is <strong>{visaType || "Unknown"}</strong>. OPT upload
                    is only required for F1(CPT/OPT).
                </Alert>
            )}

            {isF1 && (
                <Alert severity="success" variant="outlined" sx={{ mb: 2, bgcolor: "#f0fdf4", borderColor: "success.light" }}>
                    Your work authorization is F1 (CPT/OPT). Please upload your OPT documents below so HR can review your case.
                </Alert>
            )}

            {visaError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {String(visaError)}
                </Alert>
            )}

            {visaLoading && !visaCas ? (
                <Alert severity="info">Loading your visa case...</Alert>
            ) : (
                isF1 && (
                    <>
                        {nextDocKey ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Next document to upload: <strong>{nextLabel}</strong>
                            </Alert>
                        ) : (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                All documents uploaded! Please wait for HR review.
                            </Alert>
                        )}

                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                                    OPT Document Status & Uploads
                                </Typography>

                                {DOCS.map((doc) => (
                                    <Box key={doc.key} sx={{ mb: 2 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                {doc.label}
                                            </Typography>
                                            {renderStatusButton(doc.key)}
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {getDocName(doc.key) || "No file uploaded"}
                                        </Typography>

                                        {doc.key === "I-983" && (
                                            <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap" }}>
                                                <Button
                                                    variant="outlined"
                                                    component="a"
                                                    href="/templates/i983-empty.pdf"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Empty Template
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    component="a"
                                                    href="/templates/i983-sample.pdf"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Sample Template
                                                </Button>
                                            </Stack>
                                        )}

                                        <VisaDocUploader
                                            docType={doc.key}
                                            disabled={!canUploadDoc(doc.key)}
                                        />

                                        {renderStatusAlert(doc.key)}
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </>
                )
            )}
        </Box>
    );
}
