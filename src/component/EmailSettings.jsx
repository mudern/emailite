import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { invoke } from '@tauri-apps/api/tauri';

const EmailSettings = ({ visible, onClose }) => {
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        try {
            // 映射前端表单字段到后端字段
            const settings = {
                email_address: values.emailAddress,
                imap_server: values.imapServer,
                imap_port: parseInt(values.imapPort, 10), // 转换为数字
                smtp_server: values.smtpServer,
                smtp_port: parseInt(values.smtpPort, 10), // 转换为数字
                smtp_username: values.emailAddress,
                smtp_password: values.smtpPassword,
            };

            console.log(settings)

            // 调用 Tauri 命令保存设置
            await invoke('save_email_settings', { settings });
            message.success('Settings saved successfully');
            onClose();
        } catch (error) {
            console.error("Failed to save settings:", error);
            message.error('Failed to save settings');
        }
    };

    const onFinishFailed = errorInfo => {
        console.error('Failed:', errorInfo);
        message.error('表单提交失败，请检查输入内容');
    };

    return (
        <Modal
            title="Email Settings"
            visible={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                name="email_settings"
                layout="vertical"
                initialValues={{
                    imapServer: '',
                    imapPort: '',
                    smtpServer: '',
                    smtpPort: '',
                    smtpUsername: '',
                    smtpPassword: '',
                    emailAddress: '',
                }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
            >
                <Form.Item
                    label="邮箱地址"
                    name="emailAddress"
                    rules={[{ required: true, message: '请输入邮箱地址！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="IMAP 服务器"
                    name="imapServer"
                    rules={[{ required: true, message: '请输入 IMAP 服务器地址！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="IMAP 端口"
                    name="imapPort"
                    rules={[{ required: true, message: '请输入 IMAP 端口号！' }]}
                >
                    <Input type="number" />
                </Form.Item>

                <Form.Item
                    label="SMTP 服务器"
                    name="smtpServer"
                    rules={[{ required: true, message: '请输入 SMTP 服务器地址！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="SMTP 端口"
                    name="smtpPort"
                    rules={[{ required: true, message: '请输入 SMTP 端口号！' }]}
                >
                    <Input type="number" />
                </Form.Item>

                <Form.Item
                    label="SMTP 密码"
                    name="smtpPassword"
                    rules={[{ required: true, message: '请输入 SMTP 密码！' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        保存并登录
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EmailSettings;