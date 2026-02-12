const RegistrationToken = require('../models/RegistrationToken');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/users');
const EmployeeProfile = require('../models/employeeProfile');
const OnboardingApplication = require('../models/onboardingApplication');
const VisaCase = require('../models/visaCase');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { uploadDir: onboardingUploadDir } = require('../middleware/uploadOnboarding');
const {
    canHrReviewOnboarding,
    normalizeOnboardingStatus,
} = require('../utils/onboardingStatusTransitions');

const statusLabelMap = {
    not_started: 'Pending',
    in_progress: 'Pending',
    pending: 'Pending',
    submitted: 'Pending',
    in_review: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

const REQUIRED_OPT_DOCS = [
    { type: 'OPT_RECEIPT', label: 'OPT Receipt' },
    { type: 'OPT_EAD', label: 'OPT EAD' },
    { type: 'I-983', label: 'I-983' },
    { type: 'I-20', label: 'I-20' },
];

function computeVisaCaseStatus(documents = []) {
    const docsByType = new Map();
    for (const doc of documents || []) {
        if (!doc?.docType) continue;
        docsByType.set(doc.docType, doc);
    }

    for (const requiredDoc of REQUIRED_OPT_DOCS) {
        const doc = docsByType.get(requiredDoc.type);
        if (!doc) {
            return {
                status: 'action_required',
                nextDoc: requiredDoc.type,
                nextDocLabel: requiredDoc.label,
                reason: 'missing',
            };
        }

        if (doc.status === 'rejected') {
            return {
                status: 'action_required',
                nextDoc: requiredDoc.type,
                nextDocLabel: requiredDoc.label,
                reason: 'rejected',
            };
        }

        if (doc.status === 'pending') {
            return {
                status: 'pending',
                nextDoc: requiredDoc.type,
                nextDocLabel: requiredDoc.label,
                reason: 'pending',
            };
        }

        if (doc.status !== 'approved') {
            return {
                status: 'action_required',
                nextDoc: requiredDoc.type,
                nextDocLabel: requiredDoc.label,
                reason: 'missing',
            };
        }
    }

    return {
        status: 'approved',
        nextDoc: null,
        nextDocLabel: '',
        reason: 'approved',
    };
}

function mapVisaCaseStatusToNextStep(statusInfo) {
    const normalized = typeof statusInfo === 'string'
        ? { status: statusInfo, reason: statusInfo === 'approved' ? 'approved' : 'pending', nextDocLabel: '' }
        : (statusInfo || {});

    const docLabel = normalized.nextDocLabel || normalized.nextDoc || 'document';
    if (normalized.reason === 'missing') return `Waiting for employee to upload ${docLabel}`;
    if (normalized.reason === 'pending') return `Waiting for HR review (${docLabel})`;
    if (normalized.reason === 'rejected') return `Employee needs to re-upload ${docLabel}`;
    if (normalized.status === 'approved') return 'All documents approved';
    return 'Waiting for HR review';
}

function normalizeDistributionLabel(workAuth = {}) {
    const rawIsCitizenOrPR = workAuth?.isCitizenOrPR;
    const isCitizenOrPR = rawIsCitizenOrPR === true || String(rawIsCitizenOrPR).toLowerCase() === 'true';
    const citizenOrGreenCard = String(workAuth?.citizenOrGreenCard || '').trim();
    const visaType = String(workAuth?.visaType || '').trim();

    if (isCitizenOrPR) {
        if (citizenOrGreenCard === 'Citizen') return 'Citizen';
        if (citizenOrGreenCard === 'Green Card') return 'Green Card';
        return 'Other';
    }

    if (visaType === 'F1(CPT/OPT)') return 'F1 (CPT/OPT)';
    if (visaType === 'H1-B') return 'H1-B';
    return 'Other';
}

function formatWorkAuthTitle(profile) {
    if (profile?.isPermanentResidentOrCitizen === true) {
        if (profile?.residentStatus === 'citizen') return 'Citizen';
        if (profile?.residentStatus === 'green_card') return 'Green Card';
    }

    switch (profile?.workAuthorization?.type) {
        case 'h1b':
            return 'H1-B';
        case 'l2':
            return 'L2';
        case 'f1_cpt_opt':
            return 'F1(OPT)';
        case 'h4':
            return 'H4';
        case 'other':
            return 'N/A';
        default:
            return 'N/A';
    }
}

function getOnboardingWorkAuth(app) {
    const primary = app?.workAuth && typeof app.workAuth === 'object'
        ? (app.workAuth.toObject ? app.workAuth.toObject() : app.workAuth)
        : {};

    const legacy = app?.workAuthorization && typeof app.workAuthorization === 'object'
        ? (app.workAuthorization.toObject ? app.workAuthorization.toObject() : app.workAuthorization)
        : {};

    return {
        ...legacy,
        ...primary,
    };
}

function normalizeVisaType(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    const canonical = value.toLowerCase().replace(/[\s()/_-]/g, '');
    if (canonical === 'h1b') return 'h1b';
    if (canonical === 'l2') return 'l2';
    if (canonical === 'h4') return 'h4';
    if (canonical === 'f1cptopt' || canonical === 'f1opt') return 'f1_cpt_opt';
    if (canonical === 'citizen') return 'citizen';
    if (canonical === 'greencard') return 'green_card';
    if (canonical === 'other') return 'other';
    return value.toLowerCase();
}

function formatWorkAuthTitleFromOnboarding(app) {
    const workAuth = getOnboardingWorkAuth(app);
    const rawIsCitizenOrPR = workAuth?.isCitizenOrPR;
    const isCitizenOrPR = rawIsCitizenOrPR === true || String(rawIsCitizenOrPR).toLowerCase() === 'true';
    const citizenOrGreenCard = String(workAuth?.citizenOrGreenCard || workAuth?.residentStatus || '').trim().toLowerCase();
    const visaTypeRaw = String(workAuth?.visaType || workAuth?.type || '').trim();
    const normalizedVisaType = normalizeVisaType(visaTypeRaw);
    const otherVisaTitle = String(workAuth?.otherVisaTitle || workAuth?.otherTitle || '').trim();

    if (isCitizenOrPR || citizenOrGreenCard) {
        if (citizenOrGreenCard === 'citizen') return 'Citizen';
        if (citizenOrGreenCard === 'green card') return 'Green Card';
    }

    switch (normalizedVisaType) {
        case 'h1b':
            return 'H1-B';
        case 'l2':
            return 'L2';
        case 'f1_cpt_opt':
            return 'F1(OPT)';
        case 'h4':
            return 'H4';
        case 'other':
            return otherVisaTitle || 'Other';
        case 'citizen':
            return 'Citizen';
        case 'green_card':
            return 'Green Card';
        default:
            return 'N/A';
    }
}

function isVisaStatusEmployee(profile) {
    if (!profile) return false;
    // Exclude citizen and green-card holders from visa status management.
    if (profile?.residentStatus === 'citizen') return false;
    if (profile?.residentStatus === 'green_card') return false;
    return profile?.isPermanentResidentOrCitizen === false;
}

function resolveDisplayName({ app, profile, user }) {
    const firstName = app?.firstName || profile?.firstName || app?.preferredName || profile?.preferredName || '';
    const lastName = app?.lastName || profile?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    if (user?.username) return user.username;
    if (user?.email) return String(user.email).split('@')[0];
    return 'N/A';
}

function mapOnboardingToProfilePatch(app) {
    const workAuth = getOnboardingWorkAuth(app);
    const isCitizenOrPR = workAuth.isCitizenOrPR === true || String(workAuth.isCitizenOrPR).toLowerCase() === 'true';

    const workAuthorizationType = (() => {
        const normalized = normalizeVisaType(workAuth.visaType || workAuth.type);
        if (normalized === 'h1b') return 'h1b';
        if (normalized === 'l2') return 'l2';
        if (normalized === 'f1_cpt_opt') return 'f1_cpt_opt';
        if (normalized === 'h4') return 'h4';
        if (normalized) return 'other';
        return '';
    })();

    const emergencyContacts = (() => {
        if (Array.isArray(app?.emergencyContact)) return app.emergencyContact;
        if (app?.emergencyContact && (app.emergencyContact.firstName || app.emergencyContact.lastName || app.emergencyContact.phone)) {
            return [app.emergencyContact];
        }
        return [];
    })();

    return {
        firstName: app?.firstName || '',
        lastName: app?.lastName || '',
        middleName: app?.middleName || '',
        preferredName: app?.preferredName || '',
        email: app?.email || '',
        ssn: app?.ssn || '',
        dob: app?.dob || null,
        dateOfBirth: app?.dob || null,
        gender: app?.gender || '',
        cellPhone: app?.cellPhone || '',
        workPhone: app?.workPhone || '',
        phones: {
            cell: app?.cellPhone || '',
            work: app?.workPhone || '',
        },
        address: {
            line1: app?.address?.AddressLine1 || '',
            line2: app?.address?.AddressLine2 || '',
            street: app?.address?.AddressLine1 || '',
            city: app?.address?.City || '',
            state: app?.address?.State || '',
            zipCode: app?.address?.ZipCode || '',
        },
        employment: {
            visaTitle: isCitizenOrPR ? (workAuth.citizenOrGreenCard || '') : (workAuth.visaType || workAuth.type || ''),
            startDate: workAuth.startDate || null,
            endDate: workAuth.endDate || null,
        },
        isPermanentResidentOrCitizen: isCitizenOrPR,
        residentStatus: isCitizenOrPR
            ? (workAuth.citizenOrGreenCard === 'Green Card' ? 'green_card' : (workAuth.citizenOrGreenCard === 'Citizen' ? 'citizen' : ''))
            : '',
        workAuthorization: {
            type: isCitizenOrPR ? '' : workAuthorizationType,
            otherTitle: workAuth.otherVisaTitle || workAuth.otherTitle || '',
            startDate: workAuth.startDate || null,
            endDate: workAuth.endDate || null,
            optReceiptFileName: '',
        },
        reference: {
            firstName: app?.reference?.firstName || '',
            lastName: app?.reference?.lastName || '',
            middleName: app?.reference?.middleName || '',
            phone: app?.reference?.phone || '',
            email: app?.reference?.email || '',
            relationship: app?.reference?.relationship || '',
        },
        emergencyContacts,
    };
}

async function syncEmployeeProfileFromOnboarding(app, userId) {
    if (!app || !userId) return;
    const profilePatch = mapOnboardingToProfilePatch(app);
    await EmployeeProfile.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                user: userId,
                position: app.positionTitle || '',
                ...profilePatch,
            },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
}

function buildEmergencyContacts(app, profile) {
    if (Array.isArray(app?.emergencyContact) && app.emergencyContact.length > 0) {
        return app.emergencyContact;
    }
    if (app?.emergencyContact && (app.emergencyContact.firstName || app.emergencyContact.lastName || app.emergencyContact.phone)) {
        return [app.emergencyContact];
    }
    if (Array.isArray(profile?.emergencyContacts) && profile.emergencyContacts.length > 0) {
        return profile.emergencyContacts;
    }
    if (profile?.emergencyContact?.name) {
        const nameParts = String(profile.emergencyContact.name).split(' ').filter(Boolean);
        return [{
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' '),
            middleName: '',
            phone: profile.emergencyContact.phone || '',
            email: '',
            relationship: profile.emergencyContact.relationship || '',
        }];
    }
    return [];
}

function firstNonEmpty(...values) {
    for (const value of values) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) return trimmed;
            continue;
        }
        return value;
    }
    return '';
}

function splitName(fullName) {
    const raw = String(fullName || '').trim();
    if (!raw) return { firstName: '', lastName: '' };
    const parts = raw.split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
    };
}

function buildResolvedEmployeeFields({ app, profile, user, tokenPosition }) {
    const appWorkAuth = getOnboardingWorkAuth(app);
    const resolvedVisaTitle = (() => {
        const profileTitle = formatWorkAuthTitle(profile);
        if (profileTitle && profileTitle !== 'N/A') return profileTitle;
        const onboardingTitle = formatWorkAuthTitleFromOnboarding(app);
        if (onboardingTitle && onboardingTitle !== 'N/A') return onboardingTitle;
        const employmentTitle = String(profile?.employment?.visaTitle || '').trim();
        return employmentTitle || 'N/A';
    })();

    const resolvedFullName = (() => {
        const appFirst = String(app?.firstName || '').trim();
        const appLast = String(app?.lastName || '').trim();
        const appName = `${appFirst} ${appLast}`.trim();
        if (appName) return appName;

        const profileFirst = String(profile?.firstName || '').trim();
        const profileLast = String(profile?.lastName || '').trim();
        const profileName = `${profileFirst} ${profileLast}`.trim();
        if (profileName) return profileName;

        const preferred = String(app?.preferredName || profile?.preferredName || '').trim();
        if (preferred) return preferred;

        const tokenName = String(app?.tokenName || '').trim();
        if (tokenName) return tokenName;

        const username = String(user?.username || '').trim();
        if (username) return username;

        const email = String(user?.email || profile?.email || app?.email || '').trim();
        return email ? email.split('@')[0] : 'N/A';
    })();

    const tokenNameParts = splitName(firstNonEmpty(app?.tokenName, ''));
    const resolvedFirstName = firstNonEmpty(app?.firstName, profile?.firstName, tokenNameParts.firstName);
    const resolvedLastName = firstNonEmpty(app?.lastName, profile?.lastName, tokenNameParts.lastName);
    const resolvedPreferredName = firstNonEmpty(app?.preferredName, profile?.preferredName);
    const resolvedEmail = firstNonEmpty(app?.email, user?.email, profile?.email);

    return {
        fullName: resolvedFullName,
        profile: {
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            middleName: firstNonEmpty(app?.middleName, profile?.middleName),
            preferredName: resolvedPreferredName,
            email: resolvedEmail,
            ssn: firstNonEmpty(app?.ssn, profile?.ssn),
            dob: firstNonEmpty(app?.dob, profile?.dateOfBirth, profile?.dob),
            gender: firstNonEmpty(app?.gender, profile?.gender),
        },
        address: {
            line1: firstNonEmpty(app?.address?.AddressLine1, app?.address?.street, profile?.address?.line1, profile?.address?.street),
            line2: firstNonEmpty(app?.address?.AddressLine2, app?.address?.apt, profile?.address?.line2, profile?.address?.buildingApt),
            city: firstNonEmpty(app?.address?.City, app?.address?.city, profile?.address?.city),
            state: firstNonEmpty(app?.address?.State, app?.address?.state, profile?.address?.state),
            zip: firstNonEmpty(app?.address?.ZipCode, app?.address?.zip, profile?.address?.zipCode, profile?.address?.zip),
        },
        contact: {
            cellPhone: firstNonEmpty(app?.cellPhone, profile?.phones?.cell, profile?.cellPhone),
            workPhone: firstNonEmpty(app?.workPhone, profile?.phones?.work, profile?.workPhone),
        },
        workAuth: {
            isCitizenOrPR: appWorkAuth?.isCitizenOrPR,
            type: firstNonEmpty(appWorkAuth?.visaType, appWorkAuth?.type, profile?.workAuthorization?.type),
            citizenOrGreenCard: firstNonEmpty(appWorkAuth?.citizenOrGreenCard, appWorkAuth?.residentStatus),
            otherVisaTitle: firstNonEmpty(appWorkAuth?.otherVisaTitle, appWorkAuth?.otherTitle, profile?.workAuthorization?.otherTitle),
            displayTitle: resolvedVisaTitle,
        },
        reference: {
            firstName: firstNonEmpty(app?.reference?.firstName, profile?.reference?.firstName),
            lastName: firstNonEmpty(app?.reference?.lastName, profile?.reference?.lastName),
            middleName: firstNonEmpty(app?.reference?.middleName, profile?.reference?.middleName),
            phone: firstNonEmpty(app?.reference?.phone, profile?.reference?.phone),
            email: firstNonEmpty(app?.reference?.email, profile?.reference?.email),
            relationship: firstNonEmpty(app?.reference?.relationship, profile?.reference?.relationship),
        },
        employment: {
            jobTitle: profile?.position || app?.positionTitle || tokenPosition || '',
            visaTitle: resolvedVisaTitle,
            startDate: profile?.workAuthorization?.startDate || profile?.employment?.startDate || appWorkAuth?.startDate || null,
            endDate: profile?.workAuthorization?.endDate || profile?.employment?.endDate || appWorkAuth?.endDate || null,
        },
    };
}

function buildEmployeeDocuments(app, profile) {
    const onboardingDocuments = (app?.uploadedDocs || []).map((d) => ({
        source: 'onboarding',
        key: String(d.docType || 'ONBOARDING_DOC'),
        label: String(d.docType || 'Onboarding Document').replaceAll('_', ' '),
        fileName: d.originalName || d.fileName || '',
        docId: String(d._id),
    }));

    const profileDocuments = [
        { source: 'profile', key: 'driverLicense', label: 'Driver License', fileName: profile?.documents?.driverLicense || '' },
        { source: 'profile', key: 'workAuthorization', label: 'Work Authorization', fileName: profile?.documents?.workAuthorization || '' },
        { source: 'profile', key: 'optReceipt', label: 'OPT Receipt', fileName: profile?.workAuthorization?.optReceiptFileName || '' },
    ].filter((d) => String(d.fileName || '').trim());

    return [...onboardingDocuments, ...profileDocuments];
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getEmployeeInfoByUserId(userId, { syncApprovedOnboarding = false } = {}) {
    const [dbUser, app] = await Promise.all([
        User.findById(userId).select('_id email username role'),
        OnboardingApplication.findOne({ $or: [{ employee: userId }, { User: userId }] }).populate('employee User', '_id email username role'),
    ]);

    const linkedUser = app?.employee || app?.User || dbUser || null;
    let profile = await EmployeeProfile.findOne({ user: userId });

    if (syncApprovedOnboarding && normalizeOnboardingStatus(app?.status) === 'approved') {
        const linkedUserId = linkedUser?._id || app?.employee || app?.User || userId;
        await syncEmployeeProfileFromOnboarding(app, linkedUserId);
        profile = await EmployeeProfile.findOne({ user: userId });
    }

    const emailValue = String(linkedUser?.email || dbUser?.email || profile?.email || '').trim();
    const latestToken = emailValue
        ? await RegistrationToken.findOne({ email: new RegExp(`^${escapeRegExp(emailValue)}$`, 'i') }).sort({ createdAt: -1 }).select('position name').lean()
        : null;
    const tokenPosition = String(latestToken?.position || '').trim();
    const tokenName = String(latestToken?.name || '').trim();

    return {
        user: linkedUser || dbUser || null,
        profile,
        app,
        tokenPosition,
        emergencyContacts: buildEmergencyContacts(app, profile),
        documents: buildEmployeeDocuments(app, profile),
        resolved: buildResolvedEmployeeFields({
            app: app ? { ...app.toObject(), tokenName } : { tokenName },
            profile,
            user: linkedUser || dbUser || null,
            tokenPosition,
        }),
    };
}

function buildStandardEmployeeInfo(userId, employeeInfo) {
    const resolved = employeeInfo?.resolved || {};
    const app = employeeInfo?.app || null;
    const user = employeeInfo?.user || null;
    const profile = employeeInfo?.profile || null;

    return {
        userId: String(userId || user?._id || ''),
        role: user?.role || '',
        onboardingStatus: normalizeOnboardingStatus(app?.status),
        fullName: resolved?.fullName || 'N/A',
        email: resolved?.profile?.email || user?.email || profile?.email || '',
        profile: {
            firstName: resolved?.profile?.firstName || '',
            lastName: resolved?.profile?.lastName || '',
            middleName: resolved?.profile?.middleName || '',
            preferredName: resolved?.profile?.preferredName || '',
            ssn: resolved?.profile?.ssn || '',
            dob: resolved?.profile?.dob || null,
            gender: resolved?.profile?.gender || '',
            profilePicture: profile?.profilePictureUrl || profile?.documents?.profilePicture || '',
        },
        contact: {
            cellPhone: resolved?.contact?.cellPhone || '',
            workPhone: resolved?.contact?.workPhone || '',
        },
        address: {
            line1: resolved?.address?.line1 || '',
            line2: resolved?.address?.line2 || '',
            city: resolved?.address?.city || '',
            state: resolved?.address?.state || '',
            zip: resolved?.address?.zip || '',
        },
        workAuthorization: {
            isCitizenOrPR: resolved?.workAuth?.isCitizenOrPR ?? null,
            type: resolved?.workAuth?.type || resolved?.employment?.visaTitle || '',
            citizenOrGreenCard: resolved?.workAuth?.citizenOrGreenCard || '',
            otherVisaTitle: resolved?.workAuth?.otherVisaTitle || '',
            displayTitle: resolved?.workAuth?.displayTitle || resolved?.employment?.visaTitle || 'N/A',
            startDate: resolved?.employment?.startDate || null,
            endDate: resolved?.employment?.endDate || null,
        },
        employment: {
            jobTitle: resolved?.employment?.jobTitle || '',
            visaTitle: resolved?.employment?.visaTitle || 'N/A',
            startDate: resolved?.employment?.startDate || null,
            endDate: resolved?.employment?.endDate || null,
        },
        reference: {
            firstName: resolved?.reference?.firstName || '',
            lastName: resolved?.reference?.lastName || '',
            middleName: resolved?.reference?.middleName || '',
            phone: resolved?.reference?.phone || '',
            email: resolved?.reference?.email || '',
            relationship: resolved?.reference?.relationship || '',
        },
        emergencyContacts: Array.isArray(employeeInfo?.emergencyContacts) ? employeeInfo.emergencyContacts : [],
        documents: Array.isArray(employeeInfo?.documents) ? employeeInfo.documents : [],
    };
}

// --- HIRING / INVITATIONS ---
/**
 * Send an invitation email with a 3-hour token.
 */
async function sendInvitation(req, res) {
    const { email, name, position } = req.body;
    if (!email || !String(position || '').trim()) {
        return res.status(400).json({ message: 'Email and position are required' });
    }
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const newInvitation = new RegistrationToken({
            token,
            name: (name || '').trim(),
            position: String(position || '').trim(),
            email,
            status: 'unused'
        });
        await newInvitation.save();
        await sendEmail(email, token);
        res.status(201).json({ 
            message: 'Invitation sent successfully!',
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
};

/**
 * Get history of all sent registration tokens.
 */
async function getInvitationHistory(req, res) {
    try {
        const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
        const tokens = await RegistrationToken.find().sort({ createdAt: -1 }).lean();

        const emails = [...new Set(tokens.map((t) => String(t.email || '').toLowerCase()).filter(Boolean))];
        const users = await User.find({ email: { $in: emails } }).select('_id email username').lean();
        const userByEmail = new Map(users.map((u) => [String(u.email || '').toLowerCase(), u]));

        const userIds = users.map((u) => u._id);
        const profiles = await EmployeeProfile.find({ user: { $in: userIds } })
            .select('user firstName lastName preferredName')
            .lean();
        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));

        const onboardingApps = await OnboardingApplication.find({
            $or: [{ employee: { $in: userIds } }, { User: { $in: userIds } }],
        })
            .select('employee User status')
            .lean();
        const appByUserId = new Map(onboardingApps.map((a) => [String(a.employee || a.User), a]));
        const submittedStatuses = new Set(['pending', 'submitted', 'in_review', 'approved', 'rejected']);

        const history = tokens.map((item) => {
            const emailLower = String(item.email || '').toLowerCase();
            const user = userByEmail.get(emailLower);
            const profile = user ? profileByUserId.get(String(user._id)) : null;
            const app = user ? appByUserId.get(String(user._id)) : null;

            const profileName = profile
                ? `${profile.preferredName || profile.firstName || ''} ${profile.lastName || ''}`.trim()
                : '';
            const fallbackName = String(item.email || '').split('@')[0] || 'N/A';
            const name = (item.name || profileName || user?.username || fallbackName).trim();

            return {
                _id: String(item._id),
                name,
                position: item.position || '',
                email: item.email || '',
                registrationLink: `${frontendBase}/register?token=${item.token}`,
                status: app && submittedStatuses.has(app.status) ? 'Submitted' : 'Not Submitted',
                createdTime: item.createdAt,
            };
        });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ 
            message: "Unable to retrieve invitation history.", 
            error: error.message 
          });
    }
};

// ---  ONBOARDING APPLICATION REVIEW ---
/**
 *  Get all employees with 'Pending' onboarding status.
 */
async function getPendingApplication(req, res) {
    try {
        const apps = await OnboardingApplication.find({
            status: { $in: ['pending', 'submitted', 'in_review'] },
        })
            .populate('employee User', 'email')
            .sort({ updatedAt: -1 });

        const userIds = apps.map((a) => a.employee?._id || a.User?._id).filter(Boolean);
        const profiles = await EmployeeProfile.find({ user: { $in: userIds } });
        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));
        const linkedEmails = [...new Set(
            apps.map((a) => String((a.employee || a.User)?.email || '').toLowerCase()).filter(Boolean)
        )];
        const tokens = await RegistrationToken.find({ email: { $in: linkedEmails } })
            .select('email position createdAt')
            .sort({ createdAt: -1 })
            .lean();
        const tokenPositionByEmail = new Map();
        for (const t of tokens) {
            const emailKey = String(t.email || '').toLowerCase();
            if (!emailKey || tokenPositionByEmail.has(emailKey)) continue;
            tokenPositionByEmail.set(emailKey, String(t.position || '').trim());
        }

        const pendingUsers = apps.map((app) => {
            const linkedUser = app.employee || app.User;
            const profile = profileByUserId.get(String(linkedUser?._id));
            const emailKey = String(linkedUser?.email || '').toLowerCase();
            return {
                _id: String(app._id),
                userId: String(linkedUser?._id || ''),
                name: resolveDisplayName({ app, profile, user: linkedUser }),
                email: linkedUser?.email || profile?.email || '',
                position: app.positionTitle || profile?.position || tokenPositionByEmail.get(emailKey) || '',
                status: statusLabelMap[app.status] || 'Pending',
                rawStatus: app.status,
                feedback: app.rejectionFeedback || '',
                date: app.updatedAt,
            };
        });

        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending applications", error: error.message });
    }
};

async function getAllApplications(req, res) {
    try {
        const apps = await OnboardingApplication.find({})
            .populate('employee User', 'email')
            .sort({ updatedAt: -1 });

        const userIds = apps.map((a) => a.employee?._id || a.User?._id).filter(Boolean);
        const profiles = await EmployeeProfile.find({ user: { $in: userIds } });
        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));
        const linkedEmails = [...new Set(
            apps.map((a) => String((a.employee || a.User)?.email || '').toLowerCase()).filter(Boolean)
        )];
        const tokens = await RegistrationToken.find({ email: { $in: linkedEmails } })
            .select('email position createdAt')
            .sort({ createdAt: -1 })
            .lean();
        const tokenPositionByEmail = new Map();
        for (const t of tokens) {
            const emailKey = String(t.email || '').toLowerCase();
            if (!emailKey || tokenPositionByEmail.has(emailKey)) continue;
            tokenPositionByEmail.set(emailKey, String(t.position || '').trim());
        }

        const results = apps.map((app) => {
            const linkedUser = app.employee || app.User;
            const profile = profileByUserId.get(String(linkedUser?._id));
            const emailKey = String(linkedUser?.email || '').toLowerCase();
            return {
                _id: String(app._id),
                userId: String(linkedUser?._id || ''),
                name: resolveDisplayName({ app, profile, user: linkedUser }),
                email: linkedUser?.email || profile?.email || '',
                position: app.positionTitle || profile?.position || tokenPositionByEmail.get(emailKey) || '',
                status: statusLabelMap[app.status] || 'Pending',
                rawStatus: app.status,
                date: app.updatedAt,
            };
        });

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch applications", error: error.message });
    }
};

/**
 * Approve or Reject an onboarding application with feedback.
 */
async function reviewApplication(req, res) {
  try {
    const { userId, status, feedback } = req.body;
    const statusMap = { approved: 'approved', rejected: 'rejected' };
    const targetStatus = statusMap[String(status || '').toLowerCase()];
    if (!userId || !targetStatus) {
        return res.status(400).json({ message: 'userId and status (approved|rejected) are required' });
    }

    const app = await OnboardingApplication.findOne({
        $or: [{ employee: userId }, { User: userId }],
    });
    if (!app) {
        return res.status(404).json({ message: 'Onboarding application not found' });
    }

    if (!canHrReviewOnboarding(app.status, targetStatus)) {
        return res.status(409).json({
            message: `Invalid onboarding transition: ${normalizeOnboardingStatus(app.status)} -> ${targetStatus}`,
        });
    }

    app.status = targetStatus;
    if (targetStatus === 'rejected') {
        app.rejectionFeedback = (feedback || '').trim();
    } else {
        app.rejectionFeedback = '';
        const linkedUserId = app.employee || app.User || userId;
        await syncEmployeeProfileFromOnboarding(app, linkedUserId);
    }
    await app.save();

    res.status(200).json({ message: `Application ${targetStatus}`, app });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function getApplicationDetail(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const employeeInfo = await getEmployeeInfoByUserId(userId, { syncApprovedOnboarding: true });
        if (!employeeInfo.app && !employeeInfo.profile) {
            return res.status(404).json({ message: 'Application not found' });
        }

        return res.status(200).json(buildStandardEmployeeInfo(userId, employeeInfo));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch application detail', error: error.message });
    }
}

async function getEmployeeInfo(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const employeeInfo = await getEmployeeInfoByUserId(userId, { syncApprovedOnboarding: true });
        if (!employeeInfo.app && !employeeInfo.profile && !employeeInfo.user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        return res.status(200).json(buildStandardEmployeeInfo(userId, employeeInfo));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch employee info', error: error.message });
    }
}

// --- EMPLOYEE PROFILES ---
/**
 * Get all approved employee profiles (with Search).
 */
async function getAllEmployees(req, res) {
    try {
        res.set('Cache-Control', 'no-store');
        const search = String(req.query.search || '').trim().toLowerCase();
        const workAuth = String(req.query.workAuth || '').trim();
        const pageParam = Number.parseInt(req.query.page, 10);
        const pageSizeParam = Number.parseInt(req.query.pageSize, 10);
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
        const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0
            ? Math.min(pageSizeParam, 100)
            : 6;
        const users = await User.find({ role: { $in: ['employee', 'hr'] } }).select('_id email username role');
        const userIds = users.map((u) => u._id);
        const profiles = await EmployeeProfile.find({ user: { $in: userIds } });
        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));
        const onboardingApps = await OnboardingApplication.find({
            $or: [{ employee: { $in: userIds } }, { User: { $in: userIds } }],
        }).select('employee User positionTitle status workAuth');
        const appByUserId = new Map();
        for (const o of onboardingApps) {
            const employeeKey = o?.employee ? String(o.employee) : '';
            const userKey = o?.User ? String(o.User) : '';
            if (employeeKey) appByUserId.set(employeeKey, o);
            if (userKey) appByUserId.set(userKey, o);
        }
        const emailKeys = [...new Set(users.map((u) => String(u.email || '').trim().toLowerCase()).filter(Boolean))];
        const emailKeySet = new Set(emailKeys);
        const tokens = await RegistrationToken.find({})
            .select('email jobTitle position positionTitle createdAt')
            .sort({ createdAt: -1 })
            .lean();
        const tokenByEmail = new Map();
        for (const token of tokens) {
            const key = String(token?.email || '').trim().toLowerCase();
            if (!key || !emailKeySet.has(key) || tokenByEmail.has(key)) continue;
            tokenByEmail.set(key, token);
        }

        const employees = users
            .map((user) => {
                const profile = profileByUserId.get(String(user._id));
                const app = appByUserId.get(String(user._id));

                if (user.role === 'hr') {
                    const name = resolveDisplayName({ app: null, profile, user });
                    const lastNameForSort = String(profile?.lastName || user?.username || user?.email || '').trim().toLowerCase();
                    const firstNameForSort = String(profile?.preferredName || profile?.firstName || user?.username || '').trim().toLowerCase();
                    const hrJobTitle = String(profile?.position || '').trim() || 'HR';
                    const hrWorkAuthDisplay = profile ? formatWorkAuthTitle(profile) : 'N/A';
                    return {
                        _id: String(user._id),
                        name,
                        ssn: profile?.ssn || '',
                        phone: profile?.phones?.cell || '',
                        email: user.email || profile?.email || '',
                        jobTitle: hrJobTitle,
                        workAuth: hrWorkAuthDisplay,
                        // Keep legacy fields for backward compatibility.
                        position: hrJobTitle,
                        title: hrWorkAuthDisplay,
                        workAuthorization: profile?.workAuthorization || {},
                        lastNameForSort,
                        firstNameForSort,
                        role: user?.role || '',
                    };
                }

                const visibleInVisaStatus = isVisaStatusEmployee(profile);
                const normalizedAppStatus = normalizeOnboardingStatus(app?.status);

                // Keep approved employees visible, and also include employees who are in visa-status scope.
                if (user.role !== 'hr' && normalizedAppStatus !== 'approved' && !visibleInVisaStatus) {
                    return null;
                }

                const name = resolveDisplayName({ app, profile, user });
                const lastNameForSort = String(profile?.lastName || app?.lastName || user?.username || user?.email || '').trim().toLowerCase();
                const firstNameForSort = String(profile?.preferredName || profile?.firstName || app?.firstName || user?.username || '').trim().toLowerCase();
                const registrationToken = tokenByEmail.get(String(user?.email || '').trim().toLowerCase());
                const token = registrationToken;

                const workAuthDisplay = app?.workAuth?.isCitizenOrPR === true
                    ? (app?.workAuth?.citizenOrGreenCard || 'N/A')
                    : (app?.workAuth?.visaType || 'N/A');
                const jobTitleDisplay =
                    token?.jobTitle ||
                    token?.position ||
                    token?.positionTitle ||
                    'N/A';

                return {
                    _id: String(user._id),
                    name,
                    ssn: profile?.ssn || '',
                    phone: profile?.phones?.cell || '',
                    email: user.email || profile?.email || '',
                    jobTitle: jobTitleDisplay,
                    workAuth: workAuthDisplay,
                    // Keep legacy fields for backward compatibility.
                    position: jobTitleDisplay,
                    title: workAuthDisplay,
                    workAuthorization: profile?.workAuthorization || app?.workAuth || {},
                    lastNameForSort,
                    firstNameForSort,
                    role: user?.role || '',
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const byLastName = a.lastNameForSort.localeCompare(b.lastNameForSort);
                if (byLastName !== 0) return byLastName;
                const byFirstName = a.firstNameForSort.localeCompare(b.firstNameForSort);
                if (byFirstName !== 0) return byFirstName;
                return a.name.localeCompare(b.name);
            });

        const filteredEmployees = employees.filter((employee) => {
            if (workAuth && employee.workAuth !== workAuth) {
                return false;
            }

            if (!search) {
                return true;
            }

            const fields = [employee.name, employee.email, employee.jobTitle, employee.workAuth];
            return fields.some((field) => String(field || '').toLowerCase().includes(search));
        });

        const stats = filteredEmployees.reduce(
            (acc, employee) => {
                acc.totalEmployees += 1;
                if (employee.workAuth === 'Citizen' || employee.workAuth === 'Green Card') {
                    acc.citizens += 1;
                } else {
                    acc.nonCitizens += 1;
                }
                return acc;
            },
            { totalEmployees: 0, citizens: 0, nonCitizens: 0 }
        );

        const total = filteredEmployees.length;
        const totalPages = Math.ceil(total / pageSize);
        const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
        const startIndex = (currentPage - 1) * pageSize;
        const items = filteredEmployees.slice(startIndex, startIndex + pageSize);

        res.status(200).json({
            items,
            pagination: {
                page: currentPage,
                pageSize,
                total,
                totalPages,
            },
            stats,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching employee profiles", error: error.message });
    }
};

// --- VISA STATUS MANAGEMENT ---
/**
 * Get status of all OPT employees.
 */
async function getAllVisaStatus(req, res) {
    try {
        res.set('Cache-Control', 'no-store');
        const users = await User.find({ role: { $in: ['employee', 'hr'] } }).select('_id email role');
        const userIds = users.map((u) => u._id);
        const userById = new Map(users.map((u) => [String(u._id), u]));
        const emailKeys = [...new Set(users.map((u) => String(u?.email || '').trim().toLowerCase()).filter(Boolean))];

        const [profiles, onboardingApps, visaCases, tokens] = await Promise.all([
            EmployeeProfile.find({ user: { $in: userIds } }),
            OnboardingApplication.find({
                $or: [{ employee: { $in: userIds } }, { User: { $in: userIds } }],
            }).select('employee User status firstName lastName preferredName workAuth uploadedDocs positionTitle'),
            VisaCase.find({ User: { $in: userIds } }).select('User documents'),
            RegistrationToken.find({ email: { $in: emailKeys } })
                .select('email jobTitle position positionTitle createdAt')
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));
        const appByUserId = new Map(onboardingApps.map((a) => [String(a.employee || a.User), a]));
        const visaCaseByUserId = new Map(visaCases.map((v) => [String(v.User), v]));
        const tokenByEmail = new Map();
        for (const token of tokens) {
            const key = String(token?.email || '').trim().toLowerCase();
            if (!key || tokenByEmail.has(key)) continue;
            tokenByEmail.set(key, token);
        }

        const docLabelByType = new Map(REQUIRED_OPT_DOCS.map((d) => [d.type, d.label]));

        const data = users.map((u) => {
            const userId = String(u._id);
            const p = profileByUserId.get(userId);
            const user = userById.get(userId);

            if (user?.role === 'hr') {
                const hrJobTitle = String(p?.position || '').trim() || 'HR';
                const hrWorkAuthDisplay = p ? formatWorkAuthTitle(p) : 'N/A';
                return {
                    _id: userId,
                    name: resolveDisplayName({ app: null, profile: p, user }) || `${p?.firstName || ''} ${p?.middleName ? `${p.middleName} ` : ''}${p?.lastName || ''}`.trim(),
                    firstName: p?.firstName || '',
                    lastName: p?.lastName || '',
                    preferredName: p?.preferredName || '',
                    email: user?.email || p?.email || '',
                    title: hrWorkAuthDisplay,
                    jobTitle: hrJobTitle,
                    workAuth: hrWorkAuthDisplay,
                    startDate: null,
                    endDate: null,
                    daysLeft: null,
                    nextStep: null,
                    inProgress: false,
                    actionType: 'none',
                    pendingReviewDoc: null,
                    documents: [],
                    status: 'approved',
                };
            }

            const app = appByUserId.get(userId);
            const appWorkAuth = getOnboardingWorkAuth(app);
            const visaCase = visaCaseByUserId.get(userId);

            const profileTitle = p ? formatWorkAuthTitle(p) : 'N/A';
            const onboardingTitle = formatWorkAuthTitleFromOnboarding(app);
            const title = profileTitle !== 'N/A' ? profileTitle : onboardingTitle;

            const includeByProfile = isVisaStatusEmployee(p);
            const includeByOnboarding = (() => {
                if (!appWorkAuth) return false;
                const isCitizenOrPR = appWorkAuth.isCitizenOrPR === true || String(appWorkAuth.isCitizenOrPR).toLowerCase() === 'true';
                const visaType = String(appWorkAuth.visaType || appWorkAuth.type || '').trim();
                if (isCitizenOrPR) return false;
                return Boolean(visaType);
            })();
            if (!includeByProfile && !includeByOnboarding) {
                return null;
            }

            const token = tokenByEmail.get(String(user?.email || '').trim().toLowerCase());
            const jobTitle = token?.jobTitle
                || token?.position
                || token?.positionTitle
                || app?.positionTitle
                || p?.position
                || 'N/A';

            const startDate = appWorkAuth?.startDate
                ? new Date(appWorkAuth.startDate)
                : (p?.workAuthorization?.startDate ? new Date(p.workAuthorization.startDate) : null);
            const endDate = appWorkAuth?.endDate
                ? new Date(appWorkAuth.endDate)
                : (p?.workAuthorization?.endDate ? new Date(p.workAuthorization.endDate) : null);
            const daysLeft = endDate ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

            const docsByType = new Map();
            (visaCase?.documents || []).forEach((doc) => {
                if (doc?.docType) docsByType.set(doc.docType, doc);
            });
            const onboardingDocs = (app?.uploadedDocs || []).map((doc) => ({
                docId: String(doc._id),
                docType: doc.docType,
                label: docLabelByType.get(doc.docType) || String(doc.docType || '').replaceAll('_', ' '),
                originalName: doc.originalName || doc.fileName || '',
                source: 'onboarding',
                status: normalizeOnboardingStatus(app?.status) === 'approved' ? 'approved' : 'pending',
                fileId: String(doc._id),
                fileKey: doc.docType || '',
                storageKey: doc.fileName || '',
                fileName: doc.originalName || doc.fileName || '',
            }));
            const visaDocs = (visaCase?.documents || []).map((doc) => ({
                docId: String(doc._id),
                docType: doc.docType,
                label: docLabelByType.get(doc.docType) || doc.docType,
                originalName: doc.originalName,
                source: 'visa',
                status: doc.status,
                reviewStatus: doc.status,
                reviewFeedback: doc.feedback || '',
                fileId: String(doc._id),
                fileKey: doc.docType || '',
                storageKey: doc.storedName || '',
                fileName: doc.originalName || doc.storedName || '',
            }));
            const allDocuments = [...onboardingDocs, ...visaDocs];

            const isOptEmployee = title === 'F1(OPT)';
            let nextStep = 'Review Documents';
            let actionType = 'none';
            let pendingReviewDoc = null;
            const visaCaseStatusInfo = computeVisaCaseStatus(visaCase?.documents || []);
            let visaCaseStatus = visaCaseStatusInfo.status;

            const normalizedStatus = normalizeOnboardingStatus(app?.status);
            if (normalizedStatus === 'not_submitted') {
                nextStep = 'Submit onboarding application';
                actionType = 'notify';
            } else if (normalizedStatus === 'pending') {
                nextStep = 'Wait for HR approval';
                actionType = 'none';
            } else if (isOptEmployee) {
                nextStep = mapVisaCaseStatusToNextStep(visaCaseStatusInfo);

                const pendingDoc = visaCaseStatusInfo.reason === 'pending'
                    ? docsByType.get(visaCaseStatusInfo.nextDoc)
                    : null;
                if (pendingDoc && visaCaseStatusInfo.status === 'pending') {
                    actionType = 'review';
                    pendingReviewDoc = {
                        docId: String(pendingDoc._id),
                        docType: pendingDoc.docType,
                        label: docLabelByType.get(pendingDoc.docType) || pendingDoc.docType,
                        originalName: pendingDoc.originalName,
                        source: 'visa',
                    };
                } else {
                    const onboardingPendingDoc = onboardingDocs.find((doc) => doc.status === 'pending');
                    if (onboardingPendingDoc && visaCaseStatusInfo.reason === 'missing') {
                        pendingReviewDoc = {
                            docId: onboardingPendingDoc.docId,
                            docType: onboardingPendingDoc.docType,
                            label: onboardingPendingDoc.label,
                            originalName: onboardingPendingDoc.originalName,
                            source: 'onboarding',
                        };
                        // Onboarding docs are previewable here; approval still goes through onboarding review flow.
                        actionType = 'notify';
                    } else {
                        actionType = visaCaseStatus === 'action_required'
                            ? 'notify'
                            : (visaCaseStatus === 'approved' ? 'none' : 'notify');
                    }
                }
            } else {
                const hasWorkAuthDoc = allDocuments.some((d) => d.docType === 'WORK_AUTH');
                if (!hasWorkAuthDoc) {
                    nextStep = 'Please upload Work Authorization';
                    actionType = 'notify';
                } else {
                    nextStep = 'Review Documents';
                    actionType = 'none';
                }
            }

            const allRequiredDocsApproved = !isOptEmployee ? false : visaCaseStatus === 'approved';
            const inProgress = !allRequiredDocsApproved;
            const documents = visaDocs;

            return {
                _id: userId,
                name: resolveDisplayName({ app, profile: p, user }) || `${p?.firstName || ''} ${p?.middleName ? `${p.middleName} ` : ''}${p?.lastName || ''}`.trim(),
                firstName: p?.firstName || app?.firstName || '',
                lastName: p?.lastName || app?.lastName || '',
                preferredName: p?.preferredName || app?.preferredName || '',
                email: user?.email || p?.email || app?.email || '',
                title,
                jobTitle,
                workAuth: {
                    startDate: appWorkAuth?.startDate || null,
                    endDate: appWorkAuth?.endDate || null,
                },
                startDate,
                endDate,
                daysLeft,
                nextStep,
                inProgress,
                actionType,
                pendingReviewDoc,
                documents,
                status: visaCaseStatus,
            };
        }).filter(Boolean);

        res.status(200).json(data);
    } catch (error) {
    res.status(500).json({ message: "Failed to fetch visa status", error: error.message });
    }
};

async function getVisaDistribution(req, res) {
    try {
        const users = await User.find({ role: { $in: ['employee', 'hr'] } }).select('_id');
        const userIds = users.map((u) => u._id);

        const onboardingApps = await OnboardingApplication.find({
            $or: [{ employee: { $in: userIds } }, { User: { $in: userIds } }],
        }).select('employee User workAuth');

        const distributionMap = {
            Citizen: 0,
            'Green Card': 0,
            'F1 (CPT/OPT)': 0,
            'H1-B': 0,
            Other: 0,
        };

        for (const app of onboardingApps) {
            const workAuth = getOnboardingWorkAuth(app);
            const label = normalizeDistributionLabel(workAuth);
            distributionMap[label] = (distributionMap[label] || 0) + 1;
        }

        return res.status(200).json({
            distribution: [
                { label: 'Citizen', value: distributionMap.Citizen },
                { label: 'Green Card', value: distributionMap['Green Card'] },
                { label: 'F1 (CPT/OPT)', value: distributionMap['F1 (CPT/OPT)'] },
                { label: 'H1-B', value: distributionMap['H1-B'] },
                { label: 'Other', value: distributionMap.Other },
            ],
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch visa distribution', error: error.message });
    }
}

/**
 * Review specific visa document (Receipt, EAD, etc.)
 */
async function reviewVisaFile(req, res) {
    try {
        res.set('Cache-Control', 'no-store');
        const { userId, docId, status, feedback } = req.body;
        const normalizedStatus = String(status || '').toLowerCase();
        if (!userId || !docId || !['approved', 'rejected'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'userId, docId and valid status are required' });
        }

        const visaCase = await VisaCase.findOne({ User: userId });
        if (!visaCase) {
            return res.status(404).json({ message: 'Visa case not found' });
        }

        const doc = visaCase.documents.id(docId);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        doc.status = normalizedStatus;
        doc.feedback = normalizedStatus === 'rejected' ? String(feedback || '').trim() : '';
        doc.reviewedAt = new Date();
        doc.reviewedBy = req.user?._id || null;
        await visaCase.save();

        const visaCaseStatusInfo = computeVisaCaseStatus(visaCase.documents || []);
        const visaCaseStatus = visaCaseStatusInfo.status;
        const nextStep = mapVisaCaseStatusToNextStep(visaCaseStatusInfo);

        return res.status(200).json({
            message: `Document ${normalizedStatus}`,
            data: {
                ...doc.toObject(),
                reviewStatus: doc.status,
                reviewFeedback: doc.feedback,
            },
            visaCase: {
                ...visaCase.toObject(),
                status: visaCaseStatus,
                nextStep,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to review visa file', error: error.message });
    }
}

/**
 * Send notification for next visa step
 */
async function sendVisaNotification(req, res) {
    try {
        const { email, name, nextStep } = req.body;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Next Step: Visa Document',
            text: `Hello ${name}, please upload your ${nextStep} now.`
        });
        res.status(200).json({ message: 'Notification sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Notification failed.' });
    }
}

const DOC_KEY_MAP = {
    profilePicture: {
        label: 'Profile Picture',
        getValue: (profile) => profile?.profilePictureUrl || profile?.documents?.profilePicture || profile?.profilePictureFileName || '',
    },
    driverLicense: {
        label: 'Driver License',
        getValue: (profile) => profile?.documents?.driverLicense || '',
    },
    workAuthorization: {
        label: 'Work Authorization',
        getValue: (profile) => profile?.documents?.workAuthorization || '',
    },
    optReceipt: {
        label: 'OPT Receipt',
        getValue: (profile) => profile?.workAuthorization?.optReceiptFileName || '',
    },
};

function resolveLocalDocumentPath(fileName) {
    const safeName = path.basename(String(fileName || ''));
    if (!safeName) return null;

    const candidates = [
        path.join(__dirname, '..', '..', 'uploads', safeName),
        path.join(__dirname, '..', '..', 'uploads', 'onboardingDocs', safeName),
        path.join(__dirname, '..', '..', 'uploads', 'visaDocs', safeName),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            return p;
        }
    }
    return null;
}

async function streamEmployeeDocument(req, res, disposition) {
    try {
        const { userId, docKey } = req.params;
        const resolver = DOC_KEY_MAP[docKey];

        if (!userId || !resolver) {
            return res.status(400).json({ message: 'Invalid userId or docKey' });
        }

        const employeeInfo = await getEmployeeInfoByUserId(userId);
        const profile = employeeInfo.profile;
        if (!profile) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const rawValue = resolver.getValue(profile);
        if (!rawValue) {
            return res.status(404).json({ message: `${resolver.label} not found` });
        }

        // If the stored value is already a URL, redirect directly.
        if (/^https?:\/\//i.test(rawValue)) {
            return res.redirect(rawValue);
        }

        const localPath = resolveLocalDocumentPath(rawValue);
        if (!localPath) {
            return res.status(404).json({ message: `${resolver.label} file not found on server` });
        }

        if (disposition === 'attachment') {
            return res.download(localPath);
        }

        res.setHeader('Content-Disposition', `inline; filename="${path.basename(localPath)}"`);
        return res.sendFile(localPath);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to read document', error: error.message });
    }
}

async function previewEmployeeDocument(req, res) {
    return streamEmployeeDocument(req, res, 'inline');
}

async function downloadEmployeeDocument(req, res) {
    return streamEmployeeDocument(req, res, 'attachment');
}

async function streamOnboardingApplicationDocument(req, res, disposition) {
    try {
        const { userId, docId } = req.params;
        if (!userId || !docId) {
            return res.status(400).json({ message: 'Invalid userId or docId' });
        }

        const employeeInfo = await getEmployeeInfoByUserId(userId);
        const app = employeeInfo.app;
        if (!app) {
            return res.status(404).json({ message: 'Onboarding application not found' });
        }

        const document = (app.uploadedDocs || []).find((d) => String(d._id) === String(docId));
        if (!document) {
            return res.status(404).json({ message: 'Onboarding document not found' });
        }

        const localPath = path.join(onboardingUploadDir, document.fileName);
        if (!fs.existsSync(localPath)) {
            return res.status(404).json({ message: 'Onboarding document file not found on server' });
        }

        if (disposition === 'attachment') {
            return res.download(localPath, document.originalName || path.basename(localPath));
        }

        res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName || path.basename(localPath)}"`);
        return res.sendFile(localPath);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to read onboarding document', error: error.message });
    }
}

async function previewOnboardingApplicationDocument(req, res) {
    return streamOnboardingApplicationDocument(req, res, 'inline');
}

async function downloadOnboardingApplicationDocument(req, res) {
    return streamOnboardingApplicationDocument(req, res, 'attachment');
}

async function streamVisaCaseDocument(req, res, disposition) {
    try {
        const { userId, docId } = req.params;
        if (!userId || !docId) {
            return res.status(400).json({ message: 'Invalid userId or docId' });
        }

        const visaCase = await VisaCase.findOne({ User: userId });
        if (!visaCase) {
            return res.status(404).json({ message: 'Visa case not found' });
        }

        const document = visaCase.documents.id(docId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const localPath = resolveLocalDocumentPath(document.storedName);
        if (!localPath) {
            return res.status(404).json({ message: 'Document file not found on server' });
        }

        if (disposition === 'attachment') {
            return res.download(localPath, document.originalName || path.basename(localPath));
        }

        res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName || path.basename(localPath)}"`);
        return res.sendFile(localPath);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to read visa document', error: error.message });
    }
}

async function previewVisaCaseDocument(req, res) {
    return streamVisaCaseDocument(req, res, 'inline');
}

async function downloadVisaCaseDocument(req, res) {
    return streamVisaCaseDocument(req, res, 'attachment');
}

module.exports = {
    sendInvitation,
    reviewApplication,
    getAllEmployees,
    getInvitationHistory,
    getPendingApplication,
    getAllApplications,
    getApplicationDetail,
    getEmployeeInfo,
    getAllVisaStatus,
    getVisaDistribution,
    reviewVisaFile,
    sendVisaNotification,
    previewEmployeeDocument,
    downloadEmployeeDocument,
    previewOnboardingApplicationDocument,
    downloadOnboardingApplicationDocument,
    previewVisaCaseDocument,
    downloadVisaCaseDocument,
};
