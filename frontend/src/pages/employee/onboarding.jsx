import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, Card, CardContent, Typography, Divider, Grid, Stack } from "@mui/material";
import { Button, Form, Input, DatePicker, Select, Upload, Space, message } from "antd";
import { UploadOutlined, DownloadOutlined, EyeOutlined, PlusOutlined, MinusCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PageHeader from "../../components/PageHeader";
import { api } from "../../api/client";
import { fetchOnboarding, createOnboarding, saveOnboarding, submitOnboarding } from "../../store/onboardingSlice";

const API_BASE = "/api/onboarding";

const STATUS = {
    IN_PROGRESS: "in_progress",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};

const GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "no_answer", label: "I don't want to answer" },
];

const VISA_TYPES = [
    { value: "H1-B", label: "H1-B" },
    { value: "L2", label: "L2" },
    { value: "F1(CPT/OPT)", label: "F1 (CPT/OPT)" },
    { value: "H4", label: "H4" },
    { value: "Other", label: "Other" },
];

function toFormValues(application) {
    if (!application) return { emergencyContact: [{ firstName: "", lastName: "", phone: "", relationship: "" }] };

    return {
        firstName: application.firstName || "",
        lastName: application.lastName || "",
        middleName: application.middleName || "",
        preferredName: application.preferredName || "",

        address: {
            AddressLine1: application.address?.AddressLine1 || "",
            AddressLine2: application.address?.AddressLine2 || "",
            City: application.address?.City || "",
            State: application.address?.State || "",
            ZipCode: application.address?.ZipCode || "",
            Country: application.address?.Country || "",
        },

        cellPhone: application.cellPhone || "",
        workPhone: application.workPhone || "",

        email: application.email || "",

        ssn: application.ssn || "",
        dob: application.dob ? dayjs(application.dob) : null,
        gender: application.gender || "",

        workAuth: {
            isCitizenOrPR: application.workAuth?.isCitizenOrPR ?? null,
            citizenOrGreenCard: application.workAuth?.citizenOrGreenCard || "",
            visaType: application.workAuth?.visaType || "",
            otherVisaTitle: application.workAuth?.otherVisaTitle || "",
            startDate: application.workAuth?.startDate ? dayjs(application.workAuth.startDate) : null,
            endDate: application.workAuth?.endDate ? dayjs(application.workAuth.endDate) : null,
        },

        reference: {
            firstName: application.reference?.firstName || "",
            lastName: application.reference?.lastName || "",
            middleName: application.reference?.middleName || "",
            email: application.reference?.email || "",
            phone: application.reference?.phone || "",
            relationship: application.reference?.relationship || "",
        },

        emergencyContact:
            application.emergencyContact?.length > 0
                ? application.emergencyContact.map((c) => ({
                    firstName: c.firstName || "",
                    lastName: c.lastName || "",
                    middleName: c.middleName || "",
                    email: c.email || "",
                    phone: c.phone || "",
                    relationship: c.relationship || "",
                }))
                : [{ firstName: "", lastName: "", middleName: "", phone: "", relationship: "" }],
    };
}

function toPayload(values) {
    return {
        ...values,
        dob: values.dob ? values.dob.toISOString() : null,
        workAuth: {
            ...values.workAuth,
            startDate: values.workAuth?.startDate ? values.workAuth.startDate.toISOString() : null,
            endDate: values.workAuth?.endDate ? values.workAuth.endDate.toISOString() : null,
        },
    };
}

// works with Bearer token
async function openOrDownloadDoc({ docId, mode, fileName }) {
    const endpoint =
        mode === "preview"
            ? `${API_BASE}/documents/${docId}/preview`
            : `${API_BASE}/documents/${docId}`;

    const res = await api.get(endpoint, { responseType: "blob" });
    const contentType = res?.headers?.["content-type"] || "application/pdf";
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);

    if (mode === "preview") {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000); // Revoke after 1 min
        return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

function OnboardingStatusBanner({ status, feedback }) {
    if (status === STATUS.IN_PROGRESS) {
        return (
            <Alert severity="info">
                Never submitted: fill in the application fields and submit for the first time.
            </Alert>
        );
    }

    if (status === STATUS.PENDING) {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
                Your application is submitted and pending HR review; it is not editable at this time.
            </Alert>
        );
    }

    if (status === STATUS.REJECTED) {
        return (
            <Alert severity="error">
                <Stack spacing={1}>
                    <Typography fontWeight={700}>Your application was rejected.</Typography>
                    <Typography variant="body2">{feedback || "Please contact HR for more details."}</Typography>
                    <Typography variant="body2">
                        You can update your information, make changes, and resubmit.
                    </Typography>
                </Stack>
            </Alert>
        );
    }

    return null;
}

function UploadedDocsList({ docs = [], readonly, onDelete }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    Uploaded Documents
                </Typography>

                {docs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No documents uploaded yet.
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {docs.map((d) => (
                            <Box
                                key={d._id}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 1,
                                    p: 1,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                }}
                            >
                                <Box>
                                    <Typography fontWeight={700}>{d.docType}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {d.originalName || d.fileName}
                                    </Typography>
                                </Box>

                                <Space>
                                    <Button
                                        icon={<EyeOutlined />}
                                        onClick={() =>
                                            openOrDownloadDoc({
                                                docId: d._id,
                                                mode: "preview",
                                                fileName: d.originalName || d.fileName,
                                            })
                                        }
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        onClick={() =>
                                            openOrDownloadDoc({
                                                docId: d._id,
                                                mode: "download",
                                                fileName: d.originalName || d.fileName,
                                            })
                                        }
                                    >
                                        Download
                                    </Button>
                                    {!readonly && (
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => onDelete?.(d._id)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Space>
                            </Box>
                        ))}
                    </Stack>
                )}

                {readonly && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        (Pending review) Document upload is disabled.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function UploadDocsSection({ disabled, onUploaded, ensureCreated }) {
    const [docType, setDocType] = useState("DRIVER_LICENSE");
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    const uploadProps = {
        fileList,
        beforeUpload: () => false, // prevent auto upload; we handle manually
        onChange: ({ fileList: next }) => setFileList(next.slice(-1)),
        maxCount: 1,
    };

    const doUpload = async () => {
        const fileObj = fileList[0]?.originFileObj || fileList[0];
        if (!fileObj || !docType) return;

        try {
            setUploading(true);
            await ensureCreated?.();

            const formData = new FormData();
            formData.append("docType", docType);
            formData.append("file", fileObj);

            await api.post(`${API_BASE}/documents`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            message.success("Document uploaded");
            setFileList([]);
            await onUploaded?.();
        } catch (e) {
            message.error(e?.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    Upload Documents
                </Typography>

                <Stack spacing={2}>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                        <Select
                            value={docType}
                            onChange={setDocType}
                            style={{ width: 260 }}
                            disabled={disabled}
                            options={[
                                { value: "PROFILE_PIC", label: "Profile picture" },
                                { value: "DRIVER_LICENSE", label: "Driver’s license" },
                                { value: "WORK_AUTH", label: "Work authorization" },
                            ]}
                        />

                        <Upload {...uploadProps} disabled={disabled}>
                            <Button icon={<UploadOutlined />} disabled={disabled}>
                                Choose file
                            </Button>
                        </Upload>

                        <Button
                            type="primary"
                            onClick={doUpload}
                            disabled={disabled || !fileList?.length || uploading}
                            loading={uploading}
                        >
                            Upload
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        Accepted file types: PDF / JPG / PNG.
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Employee onboarding application page
export default function EmployeeOnboarding() {
    const dispatch = useDispatch();
    const { application, loading, error } = useSelector((s) => s.onboarding);
    const [form] = Form.useForm();
    const hydratedRef = useRef(false);

    // Load onboarding
    useEffect(() => {
        dispatch(fetchOnboarding());
    }, [dispatch]);

    // Determine mode
    const status = application?.status || null;

    const mode = useMemo(() => {
        // Mode A: never submitted OR not_started/in_progress
        if (!application) return "A";
        if ([STATUS.IN_PROGRESS].includes(status)) return "A";

        // Mode B: pending review
        if (status === STATUS.PENDING) return "B";

        // Mode C: rejected (editable + feedback)
        if (status === STATUS.REJECTED) return "C";

        // Approved should never be here (login redirect), but handle anyway
        if (status === STATUS.APPROVED) return "APPROVED";

        return "A";
    }, [application, status]);

    const readOnly = mode === "B" || mode === "APPROVED";

    // Initialize form values
    useEffect(() => {
        if (!application) return;
        // Avoid overwriting unsaved local edits after upload/fetch refresh.
        if (hydratedRef.current && form.isFieldsTouched(true)) return;
        form.setFieldsValue(toFormValues(application));
        hydratedRef.current = true;
    }, [application, form]);

    // Ensure onboarding exists when user first visits (Mode A with null app)
    const ensureCreated = async () => {
        if (application) return;
        await dispatch(createOnboarding());
        await dispatch(fetchOnboarding());
    };

    const onSave = async () => {
        await ensureCreated();
        const values = await form.validateFields();
        await dispatch(saveOnboarding(toPayload(values)));
        await dispatch(fetchOnboarding());
    };

    const onSubmit = async () => {
        await ensureCreated();

        // validate required fields for submission
        const values = await form.validateFields();
        await dispatch(saveOnboarding(toPayload(values)));
        await dispatch(submitOnboarding());
        await dispatch(fetchOnboarding());
    };

    const onResubmit = async () => {
        // same as submit for now
        await onSubmit();
    };

    const workAuthCitizenOrPR = Form.useWatch(["workAuth", "isCitizenOrPR"], form);
    const workAuthVisaType = Form.useWatch(["workAuth", "visaType"], form);

    const deleteDoc = async (docId) => {
        if (!docId) return;
        await api.delete(`${API_BASE}/documents/${docId}`);
        dispatch(fetchOnboarding());
    };

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            <PageHeader
                title="Onboarding Application"
                subtitle="Fill in your onboarding information and upload documents if needed."
            />

            {mode === "APPROVED" && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Your onboarding is approved.
                </Alert>
            )}

            <Stack spacing={2}>
                {error && <Alert severity="error">{String(error)}</Alert>}

                <OnboardingStatusBanner
                    status={status}
                    feedback={application?.rejectionFeedback}
                />

                <Grid container spacing={2}>
                    {/* LEFT: Form */}
                    <Grid item xs={12} lg={8}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Application Details
                                </Typography>

                                <Form
                                    form={form}
                                    layout="vertical"
                                    disabled={readOnly}
                                    initialValues={{ emergencyContact: [{ firstName: "", lastName: "", phone: "", relationship: "" }] }}
                                >
                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Name
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item
                                                label="First name"
                                                name="firstName"
                                                rules={[{ required: true, message: "First name is required" }]}
                                            >
                                                <Input placeholder="First name" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item
                                                label="Last name"
                                                name="lastName"
                                                rules={[{ required: true, message: "Last name is required" }]}
                                            >
                                                <Input placeholder="Last name" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item label="Middle name" name="middleName">
                                                <Input placeholder="Middle name (optional)" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item label="Preferred name" name="preferredName">
                                                <Input placeholder="Preferred name (optional)" />
                                            </Form.Item>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Contact
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item label="Cell phone number" name="cellPhone">
                                                <Input placeholder="(xxx) xxx-xxxx" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item label="Work phone number" name="workPhone">
                                                <Input placeholder="(xxx) xxx-xxxx" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Form.Item label="Email (locked)" name="email">
                                                <Input disabled />
                                            </Form.Item>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Address
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Building/Apt #" name={["address", "apt"]}>
                                                <Input placeholder="Apt (optional)" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={8}>
                                            <Form.Item label="Street name" name={["address", "street"]}>
                                                <Input placeholder="Street (optional)" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="City" name={["address", "city"]}>
                                                <Input placeholder="City (optional)" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="State" name={["address", "state"]}>
                                                <Input placeholder="State (optional)" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="ZIP" name={["address", "zip"]}>
                                                <Input placeholder="ZIP (optional)" />
                                            </Form.Item>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Personal info
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="SSN" name="ssn">
                                                <Input placeholder="SSN (optional)" />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Date of birth" name="dob">
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Gender" name="gender">
                                                <Select options={GENDER_OPTIONS} allowClear />
                                            </Form.Item>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Work authorization
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Form.Item
                                                label="Permanent resident or citizen of the U.S.?"
                                                name={["workAuth", "isCitizenOrPR"]}
                                                rules={[{ required: true, message: "Please select Yes or No" }]}
                                            >
                                                <Select
                                                    options={[
                                                        { value: true, label: "Yes" },
                                                        { value: false, label: "No" },
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Grid>

                                        {workAuthCitizenOrPR === true && (
                                            <Grid item xs={12} md={6}>
                                                <Form.Item
                                                    label="Select one"
                                                    name={["workAuth", "citizenOrGreenCard"]}
                                                    rules={[{ required: true, message: "Required" }]}
                                                >
                                                    <Select
                                                        options={[
                                                            { value: "Citizen", label: "Citizen" },
                                                            { value: "Green Card", label: "Green Card" },
                                                        ]}
                                                    />
                                                </Form.Item>
                                            </Grid>
                                        )}

                                        {workAuthCitizenOrPR === false && (
                                            <>
                                                <Grid item xs={12} md={6}>
                                                    <Form.Item
                                                        label="What is your work authorization?"
                                                        name={["workAuth", "visaType"]}
                                                        rules={[{ required: true, message: "Visa type is required" }]}
                                                    >
                                                        <Select
                                                            options={VISA_TYPES}
                                                        />
                                                    </Form.Item>
                                                </Grid>

                                                {workAuthVisaType === "Other" && (
                                                    <Grid item xs={12} md={6}>
                                                        <Form.Item
                                                            label="Specify visa title"
                                                            name={["workAuth", "otherVisaTitle"]}
                                                            rules={[{ required: true, message: "Visa title is required" }]}
                                                        >
                                                            <Input placeholder="e.g., TN" />
                                                        </Form.Item>
                                                    </Grid>
                                                )}

                                                <Grid item xs={12} md={6}>
                                                    <Form.Item label="Start date" name={["workAuth", "startDate"]}>
                                                        <DatePicker style={{ width: "100%" }} />
                                                    </Form.Item>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Form.Item label="End date" name={["workAuth", "endDate"]}>
                                                        <DatePicker style={{ width: "100%" }} />
                                                    </Form.Item>
                                                </Grid>

                                                {workAuthVisaType === "F1(CPT/OPT)" && (
                                                    <Grid item xs={12}>
                                                        <Alert severity="warning">
                                                            For F1(CPT/OPT), please upload your visa status documents on the Visa Status page.
                                                        </Alert>
                                                    </Grid>
                                                )}
                                            </>
                                        )}
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Reference (only 1)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        A reference is someone who can vouch for you (optional).
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="First name" name={['reference', 'firstName']}>
                                                <Input />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Last name" name={['reference', 'lastName']}>
                                                <Input />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Middle name" name={['reference', 'middleName']}>
                                                <Input />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Phone" name={['reference', 'phone']}>
                                                <Input />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Email" name={['reference', 'email']}>
                                                <Input />
                                            </Form.Item>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Form.Item label="Relationship" name={['reference', 'relationship']}>
                                                <Input />
                                            </Form.Item>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                                        Emergency contact(s)
                                    </Typography>

                                    <Form.List name="emergencyContact">
                                        {(fields, { add, remove }) => (
                                            <Stack spacing={2}>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Card key={key} variant="outlined">
                                                        <CardContent>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={12} md={4}>
                                                                    <Form.Item {...restField} label="First name" name={[name, "firstName"]}>
                                                                        <Input />
                                                                    </Form.Item>
                                                                </Grid>
                                                                <Grid item xs={12} md={4}>
                                                                    <Form.Item {...restField} label="Last name" name={[name, "lastName"]}>
                                                                        <Input />
                                                                    </Form.Item>
                                                                </Grid>
                                                                <Grid item xs={12} md={4}>
                                                                    <Form.Item {...restField} label="Middle name" name={[name, "middleName"]}>
                                                                        <Input />
                                                                    </Form.Item>
                                                                </Grid>
                                                                <Grid item xs={12} md={4}>
                                                                    <Form.Item {...restField} label="Phone" name={[name, "phone"]}>
                                                                        <Input />
                                                                    </Form.Item>
                                                                </Grid>
                                                                <Grid item xs={12} md={4}>
                                                                    <Form.Item {...restField} label="Email" name={[name, "email"]}>
                                                                        <Input />
                                                                    </Form.Item>
                                                                </Grid>
                                                                <Grid item xs={12} md={4}>
                                                                    <Form.Item {...restField} label="Relationship" name={[name, "relationship"]}>
                                                                        <Input />
                                                                    </Form.Item>
                                                                </Grid>
                                                            </Grid>

                                                            {!readOnly && fields.length > 1 && (
                                                                <Button
                                                                    danger
                                                                    icon={<MinusCircleOutlined />}
                                                                    onClick={() => remove(name)}
                                                                >
                                                                    Remove this contact
                                                                </Button>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                {!readOnly && (
                                                    <Button
                                                        type="dashed"
                                                        icon={<PlusOutlined />}
                                                        onClick={() => add({ firstName: "", lastName: "", phone: "", relationship: "" })}
                                                    >
                                                        Add another emergency contact
                                                    </Button>
                                                )}
                                            </Stack>
                                        )}
                                    </Form.List>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Documents (inside onboarding card) */}
                                    <Stack spacing={2}>
                                        <UploadedDocsList
                                            docs={application?.uploadedDocs || []}
                                            readonly={readOnly}
                                            onDelete={deleteDoc}
                                        />

                                        <UploadDocsSection
                                            disabled={readOnly}
                                            ensureCreated={ensureCreated}
                                            onUploaded={() => dispatch(fetchOnboarding())}
                                        />
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Actions */}
                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        {!readOnly && (
                                            <Space>
                                                <Button onClick={onSave} loading={loading}>
                                                    Save
                                                </Button>

                                                {mode === "A" && (
                                                    <Button type="primary" onClick={onSubmit} loading={loading}>
                                                        Submit
                                                    </Button>
                                                )}

                                                {mode === "C" && (
                                                    <Button type="primary" onClick={onResubmit} loading={loading}>
                                                        Resubmit
                                                    </Button>
                                                )}
                                            </Space>
                                        )}
                                    </Box>
                                </Form>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* RIGHT: Docs */}
                    <Grid item xs={12} lg={4}>
                        <Stack spacing={2}>
                            {/* Docs moved into the onboarding card */}
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    );
}
