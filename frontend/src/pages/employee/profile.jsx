import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Col, Form, Input, Row, message, DatePicker, Select } from "antd";
import { Box, Card, CardContent, Typography, Button as MuiButton, Stack } from "@mui/material";
import dayjs from "dayjs";

import PageHeader from "../../components/PageHeader";
import EditableSection from "../../components/editableSection";
import { fetchProfile, updateProfile } from "../../store/profileSlice";
import { fetchOnboarding } from "../../store/onboardingSlice";
import { downloadOnboardingDocument, previewOnboardingDocument } from "../../api/onboardingApi";

const GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "no_answer", label: "I don't want to answer" },
];

const VISA_TYPES = [
    { value: "Citizen", label: "Citizen" },
    { value: "Green Card", label: "Green Card" },
    { value: "H1-B", label: "H1-B" },
    { value: "L2", label: "L2" },
    { value: "F1(CPT/OPT)", label: "F1 (CPT/OPT)" },
    { value: "H4", label: "H4" },
    { value: "Other", label: "Other" },
];

const DOC_TYPE_LABELS = {
    PROFILE_PIC: "Profile Picture",
    DRIVER_LICENSE: "Driver's License",
    WORK_AUTH: "Work Authorization",
    OPT_RECEIPT: "OPT Receipt",
};

async function openOrDownloadDoc({ docId, mode, fileName }) {
    const res = mode === "preview"
        ? await previewOnboardingDocument(docId)
        : await downloadOnboardingDocument(docId);
    const contentType = res?.headers?.["content-type"] || "application/pdf";
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);

    if (mode === "preview") {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
        return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export default function Profile() {
    const dispatch = useDispatch();
    const { profile, loading, error } = useSelector((state) => state.profile);
    const { application, initialized: onboardingInitialized } = useSelector((state) => state.onboarding);
    const authUser = useSelector((state) => state.auth?.user);

    const [nameForm] = Form.useForm();
    const [addressForm] = Form.useForm();
    const [contactForm] = Form.useForm();
    const [employmentForm] = Form.useForm();
    const [emergencyForm] = Form.useForm();

    useEffect(() => {
        dispatch(fetchProfile());
        if (!onboardingInitialized && String(authUser?.role || "").toLowerCase() === "employee") {
            dispatch(fetchOnboarding());
        }
    }, [dispatch, authUser?.role, onboardingInitialized]);

    const approvedApplication = application?.status === "approved" ? application : null;

    const mergedProfile = useMemo(() => {
        const base = {
            ...profile,
            email: profile?.email || authUser?.email || "",
        };

        if (!approvedApplication) return base;

        const emergency = Array.isArray(approvedApplication.emergencyContact)
            ? approvedApplication.emergencyContact[0]
            : approvedApplication.emergencyContact;

        return {
            ...base,
            firstName: approvedApplication.firstName || base?.firstName,
            lastName: approvedApplication.lastName || base?.lastName,
            middleName: approvedApplication.middleName || base?.middleName,
            preferredName: approvedApplication.preferredName || base?.preferredName,
            email: approvedApplication.email || base?.email,
            ssn: approvedApplication.ssn || base?.ssn,
            dob: approvedApplication.dob || base?.dob,
            gender: approvedApplication.gender || base?.gender,
            address: {
                line1: approvedApplication.address?.AddressLine1 || base?.address?.line1 || "",
                line2: approvedApplication.address?.AddressLine2 || base?.address?.line2 || "",
                city: approvedApplication.address?.City || base?.address?.city || "",
                state: approvedApplication.address?.State || base?.address?.state || "",
                zipCode: approvedApplication.address?.ZipCode || base?.address?.zipCode || "",
            },
            cellPhone: approvedApplication.cellPhone || base?.cellPhone,
            workPhone: approvedApplication.workPhone || base?.workPhone,
            employment: {
                visaTitle: (
                    approvedApplication.workAuth?.isCitizenOrPR === true
                        ? approvedApplication.workAuth?.citizenOrGreenCard
                        : approvedApplication.workAuth?.visaType
                ) || base?.employment?.visaTitle || "",
                startDate: approvedApplication.workAuth?.startDate || base?.employment?.startDate || null,
                endDate: approvedApplication.workAuth?.endDate || base?.employment?.endDate || null,
            },
            emergencyContact: {
                firstName: emergency?.firstName || base?.emergencyContact?.firstName || "",
                lastName: emergency?.lastName || base?.emergencyContact?.lastName || "",
                middleName: emergency?.middleName || base?.emergencyContact?.middleName || "",
                email: emergency?.email || base?.emergencyContact?.email || "",
                phone: emergency?.phone || base?.emergencyContact?.phone || "",
                relationship: emergency?.relationship || base?.emergencyContact?.relationship || "",
            },
        };
    }, [approvedApplication, profile, authUser?.email]);

    const nameInitialValues = useMemo(() => {
        return {
            firstName: mergedProfile?.firstName || "",
            lastName: mergedProfile?.lastName || "",
            middleName: mergedProfile?.middleName || "",
            preferredName: mergedProfile?.preferredName || "",
            email: mergedProfile?.email || "",
            ssn: mergedProfile?.ssn || "",
            dob: mergedProfile?.dob ? dayjs(mergedProfile.dob) : null,
            gender: mergedProfile?.gender || "",
        };
    }, [mergedProfile]);

    const addressInitialValues = useMemo(() => {
        return {
            addressLine1: mergedProfile?.address?.line1 || "",
            addressLine2: mergedProfile?.address?.line2 || "",
            city: mergedProfile?.address?.city || "",
            state: mergedProfile?.address?.state || "",
            zip: mergedProfile?.address?.zipCode || "",
        };
    }, [mergedProfile]);

    const contactInitialValues = useMemo(() => {
        return {
            cellPhone: mergedProfile?.cellPhone || "",
            workPhone: mergedProfile?.workPhone || "",
        };
    }, [mergedProfile]);

    const employmentInitialValues = useMemo(() => {
        return {
            visaTitle: mergedProfile?.employment?.visaTitle || "",
            startDate: mergedProfile?.employment?.startDate ? dayjs(mergedProfile.employment.startDate) : null,
            endDate: mergedProfile?.employment?.endDate ? dayjs(mergedProfile.employment.endDate) : null,
        };
    }, [mergedProfile]);

    const emergencyInitialValues = useMemo(() => {
        return {
            firstName: mergedProfile?.emergencyContact?.firstName || "",
            lastName: mergedProfile?.emergencyContact?.lastName || "",
            middleName: mergedProfile?.emergencyContact?.middleName || "",
            email: mergedProfile?.emergencyContact?.email || "",
            phone: mergedProfile?.emergencyContact?.phone || "",
            relationship: mergedProfile?.emergencyContact?.relationship || "",
        };
    }, [mergedProfile]);

    useEffect(() => {
        nameForm.setFieldsValue(nameInitialValues);
        addressForm.setFieldsValue(addressInitialValues);
        contactForm.setFieldsValue(contactInitialValues);
        employmentForm.setFieldsValue(employmentInitialValues);
        emergencyForm.setFieldsValue(emergencyInitialValues);
    }, [
        nameForm,
        addressForm,
        contactForm,
        employmentForm,
        emergencyForm,
        nameInitialValues,
        addressInitialValues,
        contactInitialValues,
        employmentInitialValues,
        emergencyInitialValues,
    ]);

    const cardSx = useMemo(() => ({
        borderRadius: "16px",
        bgcolor: "white",
        border: "1px solid #eef2f7",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.02)",
    }), []);

    const renderValue = (value) => (value ? String(value) : "—");

    const InfoItem = ({ label, value }) => (
        <Box sx={{ mb: 1.5 }}>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
                {label}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 600 }}>
                {renderValue(value)}
            </Typography>
        </Box>
    );

    const saveName = async () => {
        const values = await nameForm.validateFields();
        const payload = {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName,
            preferredName: values.preferredName,
            ssn: values.ssn,
            dob: values.dob ? values.dob.toISOString() : null,
            gender: values.gender,
        };
        await dispatch(updateProfile(payload)).unwrap();
        message.success("Name info saved");
        return true;
    };

    const saveAddress = async () => {
        const values = await addressForm.validateFields();
        const payload = {
            address: {
                line1: values.addressLine1,
                line2: values.addressLine2,
                city: values.city,
                state: values.state,
                zipCode: values.zip,
            },
        };
        await dispatch(updateProfile(payload)).unwrap();
        message.success("Address saved");
        return true;
    };

    const saveContact = async () => {
        const values = await contactForm.validateFields();
        const payload = {
            cellPhone: values.cellPhone,
            workPhone: values.workPhone,
        };
        await dispatch(updateProfile(payload)).unwrap();
        message.success("Contact info saved");
        return true;
    };

    const saveEmployment = async () => {
        const values = await employmentForm.validateFields();
        const payload = {
            employment: {
                visaTitle: values.visaTitle,
                startDate: values.startDate ? values.startDate.toISOString() : null,
                endDate: values.endDate ? values.endDate.toISOString() : null,
            },
        };
        await dispatch(updateProfile(payload)).unwrap();
        message.success("Employment info saved");
        return true;
    };

    const saveEmergency = async () => {
        const values = await emergencyForm.validateFields();
        const payload = {
            emergencyContact: {
                firstName: values.firstName,
                lastName: values.lastName,
                middleName: values.middleName,
                email: values.email,
                phone: values.phone,
                relationship: values.relationship,
            },
        };
        await dispatch(updateProfile(payload)).unwrap();
        message.success("Emergency contact saved");
        return true;
    };

    const docs = application?.uploadedDocs || [];

    return (
        <Box sx={{ pb: { xs: 8, md: 12 } }}>
            <PageHeader
                title="My Profile"
                subtitle="Overview / My Profile"
            />

            {error && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message={typeof error === "string" ? error : error.message || "Failed to load profile"}
                />
            )}

            {/* Name Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <EditableSection
                        title="Name"
                        onCancel={() => {
                            nameForm.setFieldsValue(nameInitialValues);
                        }}
                        onSave={saveName}
                        saving={loading}
                    >
                        {({ isEditing }) => (
                            isEditing ? (
                                <Form
                                    form={nameForm}
                                    layout="vertical"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="First Name"
                                                name="firstName"
                                                rules={[{ required: true, message: "First name is required" }]}
                                            >
                                                <Input placeholder="First name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Middle Name"
                                                name="middleName"
                                            >
                                                <Input placeholder="Middle name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Last Name"
                                                name="lastName"
                                                rules={[{ required: true, message: "Last name is required" }]}
                                            >
                                                <Input placeholder="Last name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Preferred Name" name="preferredName">
                                                <Input placeholder="Preferred name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Email" name="email">
                                                <Input disabled />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="SSN" name="ssn">
                                                <Input placeholder="SSN" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Date of Birth" name="dob">
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Gender" name="gender">
                                                <Select options={GENDER_OPTIONS} placeholder="Select" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <Row gutter={16}>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="First name" value={nameInitialValues.firstName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Middle name" value={nameInitialValues.middleName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Last name" value={nameInitialValues.lastName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Preferred name" value={nameInitialValues.preferredName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Email" value={nameInitialValues.email} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="SSN" value={nameInitialValues.ssn} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Date of birth" value={nameInitialValues.dob ? nameInitialValues.dob.format("YYYY-MM-DD") : ""} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Gender" value={nameInitialValues.gender} />
                                    </Col>
                                </Row>
                            )
                        )}
                    </EditableSection>
                </CardContent>
            </Card>

            <Box sx={{ height: 16 }} />

            {/* Address Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <EditableSection
                        title="Address"
                        onCancel={() => {
                            addressForm.setFieldsValue(addressInitialValues);
                        }}
                        onSave={saveAddress}
                        saving={loading}
                    >
                        {({ isEditing }) => (
                            isEditing ? (
                                <Form
                                    form={addressForm}
                                    layout="vertical"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Address Line 1"
                                                name="addressLine1"
                                            >
                                                <Input placeholder="Address Line 1" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Address Line 2"
                                                name="addressLine2"
                                            >
                                                <Input placeholder="Address Line 2 (optional)" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="City"
                                                name="city"
                                            >
                                                <Input placeholder="City" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="State"
                                                name="state"
                                            >
                                                <Input placeholder="State" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="ZIP Code"
                                                name="zip"
                                            >
                                                <Input placeholder="ZIP Code" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="Address line 1" value={addressInitialValues.addressLine1} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="Address line 2" value={addressInitialValues.addressLine2} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="City" value={addressInitialValues.city} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="State" value={addressInitialValues.state} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="ZIP code" value={addressInitialValues.zip} />
                                    </Col>
                                </Row>
                            )
                        )}
                    </EditableSection>
                </CardContent>
            </Card>

            <Box sx={{ height: 16 }} />

            {/* Contact Info Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <EditableSection
                        title="Contact Information"
                        onCancel={() => {
                            contactForm.setFieldsValue(contactInitialValues);
                        }}
                        onSave={saveContact}
                        saving={loading}
                    >
                        {({ isEditing }) => (
                            isEditing ? (
                                <Form
                                    form={contactForm}
                                    layout="vertical"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Cell Phone"
                                                name="cellPhone"
                                            >
                                                <Input placeholder="Cell phone" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Work Phone"
                                                name="workPhone"
                                            >
                                                <Input placeholder="Work phone" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="Cell phone" value={contactInitialValues.cellPhone} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="Work phone" value={contactInitialValues.workPhone} />
                                    </Col>
                                </Row>
                            )
                        )}
                    </EditableSection>
                </CardContent>
            </Card>

            <Box sx={{ height: 16 }} />

            {/* Employment Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <EditableSection
                        title="Employment"
                        onCancel={() => {
                            employmentForm.setFieldsValue(employmentInitialValues);
                        }}
                        onSave={saveEmployment}
                        saving={loading}
                    >
                        {({ isEditing }) => (
                            isEditing ? (
                                <Form
                                    form={employmentForm}
                                    layout="vertical"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Visa Title" name="visaTitle">
                                                <Select options={VISA_TYPES} placeholder="Select" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item label="Start Date" name="startDate">
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item label="End Date" name="endDate">
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="Visa title" value={employmentInitialValues.visaTitle} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="Start date" value={employmentInitialValues.startDate ? employmentInitialValues.startDate.format("YYYY-MM-DD") : ""} />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <InfoItem label="End date" value={employmentInitialValues.endDate ? employmentInitialValues.endDate.format("YYYY-MM-DD") : ""} />
                                    </Col>
                                </Row>
                            )
                        )}
                    </EditableSection>
                </CardContent>
            </Card>

            <Box sx={{ height: 16 }} />

            {/* Emergency Contact Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <EditableSection
                        title="Emergency Contact"
                        onCancel={() => {
                            emergencyForm.setFieldsValue(emergencyInitialValues);
                        }}
                        onSave={saveEmergency}
                        saving={loading}>
                        {({ isEditing }) => (
                            isEditing ? (
                                <Form
                                    form={emergencyForm}
                                    layout="vertical"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="First Name"
                                                name="firstName"
                                            >
                                                <Input placeholder="First name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Middle Name"
                                                name="middleName"
                                            >
                                                <Input placeholder="Middle name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Last Name"
                                                name="lastName"
                                            >
                                                <Input placeholder="Last name" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Phone"
                                                name="phone"
                                            >
                                                <Input placeholder="Phone number" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Email"
                                                name="email"
                                            >
                                                <Input placeholder="Email" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Relationship"
                                                name="relationship"
                                            >
                                                <Input placeholder="Relationship" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>

                            ) : (
                                <Row gutter={16}>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="First name" value={emergencyInitialValues.firstName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Middle name" value={emergencyInitialValues.middleName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Last name" value={emergencyInitialValues.lastName} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Phone" value={emergencyInitialValues.phone} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Email" value={emergencyInitialValues.email} />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <InfoItem label="Relationship" value={emergencyInitialValues.relationship} />
                                    </Col>
                                </Row>
                            )
                        )}
                    </EditableSection>
                </CardContent>
            </Card>

            <Box sx={{ height: 16 }} />

            {/* Documents Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                        Documents
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
                                        <Typography fontWeight={700}>
                                            {DOC_TYPE_LABELS[d.docType] || d.docType}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {d.originalName || d.fileName}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1}>
                                        <MuiButton
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                openOrDownloadDoc({
                                                    docId: d._id,
                                                    mode: "preview",
                                                    fileName: d.originalName || d.fileName,
                                                })
                                            }
                                        >
                                            Preview
                                        </MuiButton>
                                        <MuiButton
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                openOrDownloadDoc({
                                                    docId: d._id,
                                                    mode: "download",
                                                    fileName: d.originalName || d.fileName,
                                                })
                                            }
                                        >
                                            Download
                                        </MuiButton>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
