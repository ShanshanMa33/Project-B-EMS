export const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
};

export const getVisaTitle = (profile) => {
    if (profile?.isPermanentResidentOrCitizen === true) {
        if (profile?.residentStatus === "citizen") return "Citizen";
        if (profile?.residentStatus === "green_card") return "Green Card";
    }

    const type = profile?.workAuthorization?.type;
    if (type === "h1b") return "H1-B";
    if (type === "l2") return "L2";
    if (type === "f1_cpt_opt") return "F1(OPT)";
    if (type === "h4") return "H4";
    return "N/A";
};
