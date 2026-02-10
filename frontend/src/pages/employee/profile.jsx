import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Col, Form, Input, Row, message } from "antd";
import { Box, Card, CardContent } from "@mui/material";

import PageHeader from "../../components/PageHeader";
import EditableSection from "../../components/editableSection";
import { fetchProfile, updateProfile } from "../../store/profileSlice";

export default function Profile() {
    const dispatch = useDispatch();
    // Fetch profile data from Redux store
    const { profile, loading, error } = useSelector((state) => state.profile);

    // Forms for different sections
    const [basicForm] = Form.useForm();
    const [contactForm] = Form.useForm();
    const [emergencyForm] = Form.useForm();

    useEffect(() => {
        // Fetch profile data on component mount
        dispatch(fetchProfile());
    }, [dispatch]);

    const buildBasicPayload = (values) => ({
        firstname: values.firstName,
        lastname: values.lastName,
        preferredName: values.preferredName,
    });

    const basicInitialValues = useMemo(() => {
        return {
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            preferredName: profile?.preferredName || "",
            title: profile?.title || "",
            department: profile?.department || "",
        };
    }, [profile]);

    const contactInitialValues = useMemo(() => {
        return {
            email: profile?.email || "",
            phone: profile?.phone || "",
            addressLine1: profile?.address?.line1 || "",
            addressLine2: profile?.address?.line2 || "",
            city: profile?.address?.city || "",
            state: profile?.address?.state || "",
            zip: profile?.address?.zip || "",
        };
    }, [profile]);

    const emergencyInitialValues = useMemo(() => {
        return {
            contactName: profile?.emergencyContact?.name || "",
            contactPhone: profile?.emergencyContact?.phone || "",
            relationship: profile?.emergencyContact?.relationship || "",
        }
    }, [profile]);

    useEffect(() => {
        basicForm.setFieldsValue(basicInitialValues);
        contactForm.setFieldsValue(contactInitialValues);
        emergencyForm.setFieldsValue(emergencyInitialValues);
    }, [
        profile,
        basicForm,
        contactForm,
        emergencyForm,
        basicInitialValues,
        contactInitialValues,
        emergencyInitialValues
    ]);

    const cardSx = useMemo(() => ({
        boarderRadius: "16px",
        bgcolor: "white",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.02)",
    }), []);

    const saveBasic = async () => {
        const values = await basicForm.validateFields();
        const payload = buildBasicPayload(values);
        await dispatch(updateProfile(payload)).unwrap();
        message.success("Basic info saved");
        return true; // return true to exit edit mode
    };

    const saveContact = async () => {
        const values = await contactForm.validateFields();

        const payload = {
            email: values.email,
            phone: values.phone,
            address: {
                line1: values.addressLine1,
                line2: values.addressLine2,
                city: values.city,
                state: values.state,
                zip: values.zip,
            },
        };

        await dispatch(updateProfile(payload)).unwrap();
        message.success("Contact info saved");
    };

    const saveEmergency = async () => {
        const values = await emergencyForm.validateFields();

        const payload = {
            emergencyContact: {
                name: values.contactName,
                phone: values.contactPhone,
                relationship: values.relationship,
            },
        };

        await dispatch(updateProfile(payload)).unwrap();
        message.success("Emergency contact saved");
        setEditEmergency(false);
    };

    return (
        <Box>
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

            {/* Basic Info Section */}
            <Card elevation={0} sx={cardSx}>
                <CardContent>
                    <EditableSection
                        title="Basic Information"
                        onCancel={() => {
                            basicForm.setFieldsValue(basicInitialValues);
                        }}
                        onSave={saveBasic}
                        saving={loading}
                    >
                        {({ isEditing }) => (
                            <Form
                                form={basicForm}
                                layout="vertical"
                                disabled={!isEditing}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="First Name"
                                            name="firstName"
                                            rules={[{ required: true, message: "First name is required" }]}
                                        >
                                            <Input placeholder="First name" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Last Name"
                                            name="lastName"
                                            rules={[{ required: true, message: "Last name is required" }]}
                                        >
                                            <Input placeholder="Last name" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item label="Preferred Name" name="preferredName">
                                            <Input placeholder="Preferred name (optional)" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
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
                            <Form
                                form={contactForm}
                                layout="vertical"
                                disabled={!isEditing}>
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Email"
                                            name="email"
                                            rules={[{
                                                type: "email",
                                                message: "Please enter a valid email",
                                            }]}>
                                            <Input placeholder="Email address" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Phone"
                                            name="phone">
                                            <Input placeholder="Phone number" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Address Line 1"
                                            name="addressLine1">
                                            <Input placeholder="Address Line 1" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Address Line 2"
                                            name="addressLine2">
                                            <Input placeholder="Address Line 2 (optional)" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="City"
                                            name="city">
                                            <Input placeholder="City" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="State"
                                            name="state">
                                            <Input placeholder="State" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="ZIP Code"
                                            name="zip">
                                            <Input placeholder="ZIP Code" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
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
                            <Form
                                form={emergencyForm}
                                layout="vertical"
                                disabled={!isEditing}>
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Emergency Contact Name"
                                            name="contactName"
                                            rules={[{ required: true, message: "Name is required" }]}>
                                            <Input placeholder="Full name of emergency contact" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Relationship"
                                            name="relationship">
                                            <Input placeholder="Relationship to you (e.g. spouse, parent, friend)" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Phone"
                                            name="contactPhone"
                                            rules={[{ required: true, message: "Phone number is required" }]}>
                                            <Input placeholder="Phone number of emergency contact" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>

                        )}
                    </EditableSection>
                </CardContent>
            </Card>
        </Box>
    );
}