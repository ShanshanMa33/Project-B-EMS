import React, { useMemo } from "react";


function VisaTimeline({ steps = [], onStepClick, title = "Visa Timeline" }) {
    const normalized = useMemo(() => {
        const arr = Array.isArray(steps) ? steps : [];
        return arr.map((s) => ({
            stepKey: s.stepKey,
            title: s.title || prettyStepTitle(s.stepKey),
            status: s.status || "not_started",
            updatedAt: s.updatedAt,
        }));
    }, [steps]);

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <span style={styles.legend}>
                    <LegendDot label="Not started" status="not_started" />
                    <LegendDot label="In progress" status="in_progress" />
                    <LegendDot label="Completed" status="completed" />
                </span>
            </div>

            {normalized.length === 0 ? (
                <p style={{ margin: 0, opacity: 0.8 }}>
                    No steps yet. (Steps can be added by backend seed or first-time setup.)
                </p>
            ) : (
                <ol style={styles.list}>
                    {normalized.map((step, idx) => (
                        <li key={step.stepKey || idx} style={styles.item}>
                            <div style={styles.row}>
                                <div style={styles.left}>
                                    <span style={{ ...styles.dot, ...dotStyle(step.status) }} />
                                    <div>
                                        <div style={styles.stepTitle}>
                                            {step.title}
                                            <span style={{ ...styles.badge, ...badgeStyle(step.status) }}>
                                                {labelForStatus(step.status)}
                                            </span>
                                        </div>
                                        <div style={styles.stepMeta}>
                                            Key: <code>{step.stepKey}</code>
                                            {step.updatedAt ? (
                                                <>
                                                    {" "}
                                                    • Updated:{" "}
                                                    {new Date(step.updatedAt).toLocaleString()}
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {typeof onStepClick === "function" ? (
                                    <button
                                        style={styles.btn}
                                        onClick={() => onStepClick(step)}
                                        type="button"
                                    >
                                        View
                                    </button>
                                ) : null}
                            </div>

                            {/* connector line */}
                            {idx !== normalized.length - 1 ? (
                                <div style={styles.connectorWrap}>
                                    <div style={styles.connector} />
                                </div>
                            ) : null}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function LegendDot({ status, label }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...styles.dotSmall, ...dotStyle(status) }} />
            <span style={{ fontSize: 12, opacity: 0.9 }}>{label}</span>
        </span>
    );
}

function labelForStatus(status) {
    if (status === "completed") return "Completed";
    if (status === "in_progress") return "In progress";
    return "Not started";
}

function dotStyle(status) {
    if (status === "completed") return { background: "#22c55e" };
    if (status === "in_progress") return { background: "#f59e0b" };
    return { background: "#9ca3af" };
}

function badgeStyle(status) {
    if (status === "completed")
        return { background: "#dcfce7", borderColor: "#86efac" };
    if (status === "in_progress")
        return { background: "#fffbeb", borderColor: "#fcd34d" };
    return { background: "#f3f4f6", borderColor: "#e5e7eb" };
}

function prettyStepTitle(stepKey) {
    if (!stepKey) return "Unknown Step";
    // "upload_passport" -> "Upload Passport"
    return stepKey
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = {
    card: {
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 12,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    legend: {
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
    },
    list: {
        margin: 0,
        paddingLeft: 0,
        listStyle: "none",
    },
    item: {
        position: "relative",
        paddingBottom: 12,
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    left: {
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flex: 1,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 999,
        marginTop: 4,
        flexShrink: 0,
    },
    dotSmall: {
        width: 10,
        height: 10,
        borderRadius: 999,
        flexShrink: 0,
    },
    stepTitle: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 600,
    },
    badge: {
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid",
        lineHeight: 1.4,
    },
    stepMeta: {
        marginTop: 4,
        fontSize: 12,
        opacity: 0.85,
    },
    btn: {
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #333",
        background: "transparent",
        cursor: "pointer",
        height: 34,
        whiteSpace: "nowrap",
    },
    connectorWrap: {
        marginLeft: 6,
        paddingLeft: 7,
    },
    connector: {
        height: 18,
        borderLeft: "2px solid #e5e7eb",
        marginTop: 8,
    },
};

export default VisaTimeline;
