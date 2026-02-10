import React, { useMemo } from "react";
import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

function toStepStatus(doc) {
    if (!doc) return { chip: "Not started", color: "default" };
    if (doc.status === "approved") return { chip: "Completed", color: "success" };
    if (doc.status === "rejected") return { chip: "Rejected", color: "error" };
    return { chip: "Pending", color: "warning" };
}

export default function VisaApplicationTrack({ stages = [], docsMap = {}, onView }) {
    const items = useMemo(() => {
        return stages.map((s) => {
            const doc = docsMap[s.docType];
            const ui = toStepStatus(doc);

            const dateText = doc?.uploadedAt
                ? new Date(doc.uploadedAt).toLocaleDateString()
                : "";

            return {
                key: s.docType,
                title: s.trackTitle,
                subtitle:
                    doc?.status === "approved"
                        ? `${dateText} • Approved by HR`
                        : doc?.status === "pending"
                            ? `${dateText} • Waiting for HR review`
                            : doc?.status === "rejected"
                                ? `${dateText} • Rejected: ${doc?.feedback || "Needs update"}`
                                : "Not uploaded yet",
                chip: ui.chip,
                chipColor: ui.color,
                canView: !!doc,
                doc,
            };
        });
    }, [stages, docsMap]);

    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#0f172a", mb: 2 }}>
                    Application Track
                </Typography>

                <Box sx={{ display: "grid", gap: 1.5 }}>
                    {items.map((it, idx) => (
                        <Box
                            key={it.key}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "#f8fafc",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                    <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                        {it.title}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={it.chip}
                                        color={it.chipColor}
                                        variant={it.chipColor === "default" ? "outlined" : "filled"}
                                        sx={{ fontWeight: 800 }}
                                    />
                                </Box>

                                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.25 }}>
                                    {it.subtitle}
                                </Typography>
                            </Box>

                            <Button
                                variant="outlined"
                                disabled={!it.canView}
                                onClick={() => onView?.(it.doc)}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
                            >
                                View
                            </Button>
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
}
