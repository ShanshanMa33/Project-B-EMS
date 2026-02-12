const VALID_DOC_STATUS = new Set(['pending', 'approved', 'rejected']);

const DOC_SEQUENCE = [
    { key: 'optReceipt', label: 'OPT Receipt' },
    { key: 'optEad', label: 'OPT EAD' },
    { key: 'i983', label: 'I-983' },
    { key: 'i20', label: 'I-20' },
];

function normalizeStatus(status) {
    return VALID_DOC_STATUS.has(status) ? status : null;
}

function buildUserVisaStatusFromDocuments(documents = []) {
    const byType = new Map();
    for (const doc of documents) {
        if (doc?.docType) byType.set(doc.docType, doc);
    }

    return {
        optReceipt: { status: normalizeStatus(byType.get('OPT_RECEIPT')?.status) },
        optEad: { status: normalizeStatus(byType.get('OPT_EAD')?.status) },
        i983: { status: normalizeStatus(byType.get('I-983')?.status) },
        i20: { status: normalizeStatus(byType.get('I-20')?.status) },
    };
}

function getNextStep(userVisaStatus) {
    const statuses = DOC_SEQUENCE.reduce((acc, step) => {
        acc[step.key] = normalizeStatus(userVisaStatus?.[step.key]?.status);
        return acc;
    }, {});

    for (const step of DOC_SEQUENCE) {
        if (statuses[step.key] === 'rejected') {
            return `Please fix HR feedback and re-upload ${step.label}`;
        }
    }

    if (statuses.optReceipt === null || statuses.optReceipt === 'pending') {
        return 'Waiting for HR to approve OPT Receipt';
    }

    if (statuses.optEad === null) {
        return 'Please upload OPT EAD';
    }
    if (statuses.optEad === 'pending') {
        return 'Waiting for HR to approve OPT EAD';
    }

    if (statuses.i983 === null) {
        return 'Please upload I-983';
    }
    if (statuses.i983 === 'pending') {
        return 'Waiting for HR to approve I-983';
    }

    if (statuses.i20 === null) {
        return 'Please upload I-20';
    }
    if (statuses.i20 === 'pending') {
        return 'Waiting for HR to approve I-20';
    }
    if (statuses.i20 === 'approved') {
        return 'All documents have been approved';
    }

    return 'Waiting for HR to approve I-20';
}

module.exports = {
    buildUserVisaStatusFromDocuments,
    getNextStep,
};
