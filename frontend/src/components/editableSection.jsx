import React, { useMemo, useState } from "react";
import { Button, Card, Modal, Space, Typography } from "antd";

const { Text } = Typography;

/**
 * EditableSection (reusable edit wrapper)
 *
 * What it does:
 * - Shows section title + Edit button
 * - When editing: shows Save + Cancel
 * - Cancel triggers confirm modal: "Discard changes?"
 *
 * Props:
 * - title: string (section title)
 * - isEditing?: boolean (controlled mode - optional)
 * - onEdit?: () => void
 * - onSave?: () => Promise<void> | void
 * - onCancel?: () => void
 * - saving?: boolean (show loading on Save)
 * - disabled?: boolean (disable Edit/Save)
 * - extra?: ReactNode (right side extra content)
 * - children: ReactNode OR function({ isEditing }) => ReactNode
 *
 * Usage (simple):
 * <EditableSection
 *   title="Personal Info"
 *   onSave={handleSave}
 * >
 *   <MyForm disabled={!isEditing} />
 * </EditableSection>
 */
export default function EditableSection({
    title,
    isEditing: isEditingProp,
    onEdit,
    onSave,
    onCancel,
    saving = false,
    disabled = false,
    extra = null,
    children,
}) {
    // Uncontrolled editing state fallback
    const [editingInternal, setEditingInternal] = useState(false);
    const isControlled = typeof isEditingProp === "boolean";
    const isEditing = isControlled ? isEditingProp : editingInternal;

    const [discardOpen, setDiscardOpen] = useState(false);

    const headerRight = useMemo(() => {
        if (!isEditing) {
            return (
                <Space>
                    {extra}
                    <Button
                        type="primary"
                        onClick={() => {
                            if (!isControlled) setEditingInternal(true);
                            onEdit?.();
                        }}
                        disabled={disabled}
                    >
                        Edit
                    </Button>
                </Space>
            );
        }

        return (
            <Space>
                {extra}
                <Button
                    onClick={() => setDiscardOpen(true)}
                    disabled={disabled || saving}
                >
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={async () => {
                        await onSave?.();
                        // If uncontrolled, auto-exit edit mode after save
                        if (!isControlled) setEditingInternal(false);
                    }}
                    loading={saving}
                    disabled={disabled}
                >
                    Save
                </Button>
            </Space>
        );
    }, [isEditing, extra, disabled, saving, isControlled, onEdit, onSave]);

    const renderedChildren =
        typeof children === "function" ? children({ isEditing }) : children;

    return (
        <>
            <Card
                styles={{ body: { paddingTop: 12 } }}
                title={
                    <Space orientation="vertical" size={2} style={{ width: "100%" }}>
                        <Text strong style={{ fontSize: 16 }}>
                            {title}
                        </Text>
                    </Space>
                }
                extra={headerRight}
            >
                {renderedChildren}
            </Card>

            <Modal
                title="Discard changes?"
                open={discardOpen}
                onCancel={() => setDiscardOpen(false)}
                okText="Discard"
                cancelText="Keep editing"
                okButtonProps={{ danger: true }}
                onOk={() => {
                    setDiscardOpen(false);

                    // If uncontrolled, exit edit mode on discard
                    if (!isControlled) setEditingInternal(false);

                    onCancel?.();
                }}
            >
                <Text>
                    You have unsaved changes. If you discard, your edits will be lost.
                </Text>
            </Modal>
        </>
    );
}
