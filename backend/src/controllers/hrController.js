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
const { buildUserVisaStatusFromDocuments, getNextStep } = require('../utils/visaNextStep');
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

// --- HIRING / INVITATIONS ---
/**
 * Send an invitation email with a 3-hour token.
 */
async function sendInvitation(req, res) {
    const { email, name } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const newInvitation = new RegistrationToken({
            token,
            name: (name || '').trim(),
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

        const pendingUsers = apps.map((app) => {
            const linkedUser = app.employee || app.User;
            const profile = profileByUserId.get(String(linkedUser?._id));
            return {
                _id: String(app._id),
                userId: String(linkedUser?._id || ''),
                name: resolveDisplayName({ app, profile, user: linkedUser }),
                email: linkedUser?.email || profile?.email || '',
                position: app.positionTitle || profile?.position || '',
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

        const results = apps.map((app) => {
            const linkedUser = app.employee || app.User;
            const profile = profileByUserId.get(String(linkedUser?._id));
            return {
                _id: String(app._id),
                userId: String(linkedUser?._id || ''),
                name: resolveDisplayName({ app, profile, user: linkedUser }),
                email: linkedUser?.email || profile?.email || '',
                position: app.positionTitle || profile?.position || '',
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

        const app = await OnboardingApplication.findOne({
            $or: [{ employee: userId }, { User: userId }],
        }).populate('employee User', 'email username');
        const profile = await EmployeeProfile.findOne({ user: userId });

        if (!app && !profile) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const emergencyContacts = (() => {
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
        })();

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

        const documents = [...onboardingDocuments, ...profileDocuments];

        return res.status(200).json({ app, profile, emergencyContacts, documents });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch application detail', error: error.message });
    }
}

// --- EMPLOYEE PROFILES ---
/**
 * Get all approved employee profiles (with Search).
 */
async function getAllEmployees(req, res) {
    try {
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
        }).select('employee User positionTitle status');
        const appByUserId = new Map(onboardingApps.map((a) => [String(a.employee || a.User), a]));

        const employees = users
            .map((user) => {
                const profile = profileByUserId.get(String(user._id));
                const app = appByUserId.get(String(user._id));
                const visibleInVisaStatus = isVisaStatusEmployee(profile);

                // Keep approved employees visible, and also include employees who are in visa-status scope.
                if (user.role !== 'hr' && app?.status !== 'approved' && !visibleInVisaStatus) {
                    return null;
                }

                const name = profile
                    ? `${profile.preferredName || profile.firstName || ''} ${profile.lastName || ''}`.trim()
                    : (user.username || user.email || 'N/A');

                return {
                    _id: String(user._id),
                    name,
                    ssn: profile?.ssn || '',
                    phone: profile?.phones?.cell || '',
                    email: user.email || profile?.email || '',
                    position: profile?.position || app?.positionTitle || (user.role === 'hr' ? 'HR' : ''),
                    title: profile ? formatWorkAuthTitle(profile) : 'N/A',
                    workAuthorization: profile?.workAuthorization || {},
                    role: user.role,
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));

        const filteredEmployees = employees.filter((employee) => {
            if (workAuth && employee.title !== workAuth) {
                return false;
            }

            if (!search) {
                return true;
            }

            const fields = [employee.name, employee.email, employee.position, employee.title];
            return fields.some((field) => String(field || '').toLowerCase().includes(search));
        });

        const stats = filteredEmployees.reduce(
            (acc, employee) => {
                acc.totalEmployees += 1;
                if (employee.title === 'Citizen' || employee.title === 'Green Card') {
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
        const allProfiles = await EmployeeProfile.find({});
        const profiles = allProfiles.filter(isVisaStatusEmployee);
        const userIds = profiles.map((p) => p.user).filter(Boolean);
        const users = await User.find({ _id: { $in: userIds } }).select('_id email');
        const userById = new Map(users.map((u) => [String(u._id), u]));
        const onboardingApps = await OnboardingApplication.find({ User: { $in: userIds } }).select('User status');
        const appByUserId = new Map(onboardingApps.map((a) => [String(a.User), a]));
        const visaCases = await VisaCase.find({ User: { $in: userIds } }).select('User documents');
        const visaCaseByUserId = new Map(visaCases.map((v) => [String(v.User), v]));

        const REQUIRED_OPT_DOCS = [
            { type: 'OPT_RECEIPT', label: 'OPT Receipt' },
            { type: 'OPT_EAD', label: 'OPT EAD' },
            { type: 'I-983', label: 'I-983' },
            { type: 'I-20', label: 'I-20' },
        ];
        const docLabelByType = new Map(REQUIRED_OPT_DOCS.map((d) => [d.type, d.label]));

        const data = profiles.map((p) => {
            const userId = String(p.user);
            const endDate = p.workAuthorization?.endDate ? new Date(p.workAuthorization.endDate) : null;
            const startDate = p.workAuthorization?.startDate ? new Date(p.workAuthorization.startDate) : null;
            const daysLeft = endDate ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const user = userById.get(userId);
            const visaCase = visaCaseByUserId.get(userId);
            const app = appByUserId.get(userId);

            const docsByType = new Map();
            (visaCase?.documents || []).forEach((doc) => {
                if (doc?.docType) docsByType.set(doc.docType, doc);
            });

            const title = formatWorkAuthTitle(p);
            const isOptEmployee = title === 'F1(OPT)';
            let nextStep = 'Review Documents';
            let actionType = 'notify';
            let pendingReviewDoc = null;

            if (app?.status === 'not_started') {
                nextStep = 'Submit onboarding application';
            } else if (app?.status === 'in_progress') {
                nextStep = 'Complete onboarding application';
            } else if (app?.status === 'submitted' || app?.status === 'in_review') {
                nextStep = 'Wait for HR approval';
            } else if (isOptEmployee) {
                const userVisaStatus = buildUserVisaStatusFromDocuments(visaCase?.documents || []);
                nextStep = getNextStep(userVisaStatus);

                const pendingDoc = REQUIRED_OPT_DOCS.map((d) => docsByType.get(d.type)).find((d) => d && d.status === 'pending');
                if (pendingDoc) {
                    actionType = 'review';
                    pendingReviewDoc = {
                        docId: String(pendingDoc._id),
                        docType: pendingDoc.docType,
                        label: docLabelByType.get(pendingDoc.docType) || pendingDoc.docType,
                        originalName: pendingDoc.originalName,
                    };
                } else {
                    actionType = nextStep === 'All documents have been approved' ? 'none' : 'notify';
                }
            }

            const allRequiredDocsApproved = !isOptEmployee
                ? false
                : REQUIRED_OPT_DOCS.every((d) => docsByType.get(d.type)?.status === 'approved');
            const inProgress = !allRequiredDocsApproved;
            const approvedDocuments = (visaCase?.documents || [])
                .filter((doc) => doc.status === 'approved')
                .map((doc) => ({
                    docId: String(doc._id),
                    docType: doc.docType,
                    label: docLabelByType.get(doc.docType) || doc.docType,
                    originalName: doc.originalName,
                }));

            return {
                _id: userId,
                name: `${p.firstName || ''} ${p.middleName ? `${p.middleName} ` : ''}${p.lastName || ''}`.trim(),
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                preferredName: p.preferredName || '',
                email: user?.email || p.email || '',
                title,
                startDate,
                endDate,
                daysLeft,
                nextStep,
                inProgress,
                actionType,
                pendingReviewDoc,
                approvedDocuments,
            };
        });

        res.status(200).json(data);
    } catch (error) {
    res.status(500).json({ message: "Failed to fetch visa status", error: error.message });
    }
};

/**
 * Review specific visa document (Receipt, EAD, etc.)
 */
async function reviewVisaFile(req, res) {
    try {
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

        return res.status(200).json({ message: `Document ${normalizedStatus}`, data: doc });
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

        const profile = await EmployeeProfile.findOne({ user: userId });
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

        const app = await OnboardingApplication.findOne({
            $or: [{ employee: userId }, { User: userId }],
        });
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
    getAllVisaStatus,
    reviewVisaFile,
    sendVisaNotification,
    previewEmployeeDocument,
    downloadEmployeeDocument,
    previewOnboardingApplicationDocument,
    downloadOnboardingApplicationDocument,
    previewVisaCaseDocument,
    downloadVisaCaseDocument,
};
