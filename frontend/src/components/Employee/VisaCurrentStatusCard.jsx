import React, { useMemo } from "react";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";

function pillColor(status) {
    if (status === "completed" || status === "approved") return "success";
    if (status === "rejected") return "error";
    if (status === "pending" || status === "in_progress") return "warning";
    return "default";
}

export default function VisaCurrentStatusCard({ stages = [], docMap = {} }) {
    const { title, badgeText, badgeColor, etaText } = useMemo(() => {
        for (const stage of stages) {
            const doc = docMap[stage.docType];
            if (!doc) {
                return { title: `${stage.label} Upload`, badgeText: "Not Started", badgeColor: "default", etaText: "" };
            }
            if (doc.status === "rejected") {
                return { title: `${stage.label} Needs Fix`, badgeText: "Rejected", badgeColor: "error", etaText: "Please fix and re-upload" };
            }
            if (doc.status === "pending") {
                return { title: `${stage.label} Under Review`, badgeText: "Pending", badgeColor: "warning", etaText: "Estimated completion: 3 days" };
            }
        }
        return { title: "All Documents Uploaded", badgeText: "Completed", badgeColor: "success", etaText: "" };
    }, [stages, docMap]);

    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                        Current Status
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 26, color: '#0f172a', mt: 0.5 }}>
                        {title}
                    </Typography>
                    {!!etaText && (
                        <Typography variant='body2' sx={{ color: '#64748b', mt: 0.5 }}>
                            {etaText}
                        </Typography>
                    )}
                </Box>

                <Chip
                    label={badgeText}
                    color={badgeColor}
                    variant={badgeColor === "default" ? "outlined" : "filled"}
                    sx={{ fontWeight: 900, px: 1 }}
                />
            </CardContent>
        </Card>
    );
}