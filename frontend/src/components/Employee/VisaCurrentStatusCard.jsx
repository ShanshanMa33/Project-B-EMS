import React from "react";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";

export default function VisaCurrentStatusCard({ stages = [], docMap = {} }) {
    let title = "All Documents Uploaded";
    let badgeText = "Completed";
    let badgeColor = "success";
    let etaText = "";

    for (const stage of stages) {
        const doc = docMap[stage.docType];
        if (!doc) {
            title = `${stage.label} Upload`;
            badgeText = "Not Started";
            badgeColor = "default";
            break;
        }
        if (doc.status === "rejected") {
            title = `${stage.label} Needs Fix`;
            badgeText = "Rejected";
            badgeColor = "error";
            etaText = "Please fix and re-upload";
            break;
        }
        if (doc.status === "pending") {
            title = `${stage.label} Under Review`;
            badgeText = "Pending";
            badgeColor = "warning";
            etaText = "Estimated completion: 3 days";
            break;
        }
    }

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
