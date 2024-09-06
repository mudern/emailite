import React, { useState } from 'react';
import { Input, Button, Form, message, Upload, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/tauri';

const { TextArea } = Input;

const EmailWrite = () => {
    const [form] = Form.useForm();
    const [attachments, setAttachments] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const navigate = useNavigate();

    const handleSend = () => {
        form
            .validateFields()
            .then(values => {
                setIsConfirmVisible(true);
            })
            .catch(info => {
                message.error('请填写所有字段并确保邮箱格式正确');
            });
    };

    const handleConfirmSend = async () => {
        try {
            const values = await form.validateFields();
            const emailData = {
                id: 0,  // 如果不需要设置 id，可以设置为 0 或者不传递
                sender: values.recipient,
                sent_date: new Date().toISOString(),
                subject: values.subject,
                body: values.content,
                attachments: attachments.length > 0 ? JSON.stringify(attachments.map(file => file.originFileObj.name)) : null,
                is_read: false
            };

            await invoke('send_email_handler', { email: emailData }); // 确保方法名和参数名一致
            message.success('邮件已发送');
            navigate('/');
        } catch (error) {
            console.error('Failed to send email:', error);
            message.error('邮件发送失败');
        }
    };

    const handleCancel = () => {
        setIsModalVisible(true);
    };

    const handleConfirmCancel = () => {
        navigate(-1);
    };

    const handleUploadChange = ({ fileList }) => {
        setAttachments(fileList);
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ recipient: '', subject: '', content: '' }}
            >
                <Form.Item
                    name="recipient"
                    label="收件人"
                    rules={[
                        { required: true, message: '请输入收件人邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                >
                    <Input placeholder="输入收件人邮箱" />
                </Form.Item>
                <Form.Item
                    name="subject"
                    label="主题"
                    rules={[{ required: true, message: '请输入邮件主题' }]}
                >
                    <Input placeholder="输入邮件主题" />
                </Form.Item>
                <Form.Item
                    name="content"
                    label="内容"
                    rules={[{ required: true, message: '请输入邮件内容' }]}
                >
                    <TextArea rows={10} placeholder="输入邮件内容" />
                </Form.Item>
                <Form.Item>
                    <Upload
                        multiple
                        beforeUpload={() => true}
                        onChange={handleUploadChange}
                        fileList={attachments}
                        showUploadList={{ showPreviewIcon: true }}
                    >
                        <Button icon={<UploadOutlined />}>上传附件</Button>
                    </Upload>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={handleSend} style={{ marginRight: '8px' }}>
                        发送
                    </Button>
                    <Button onClick={handleCancel} danger>
                        取消
                    </Button>
                </Form.Item>
            </Form>

            {/* 发送确认弹窗 */}
            <Modal
                title="确认发送"
                visible={isConfirmVisible}
                onOk={handleConfirmSend}
                onCancel={() => setIsConfirmVisible(false)}
                okText="确认"
                cancelText="取消"
            >
                <p>确认发送这封邮件吗？</p>
            </Modal>

            {/* 取消确认弹窗 */}
            <Modal
                title="确认取消"
                visible={isModalVisible}
                onOk={handleConfirmCancel}
                onCancel={() => setIsModalVisible(false)}
                okText="确认"
                cancelText="取消"
            >
                <p>未保存的更改将丢失，确认返回？</p>
            </Modal>
        </div>
    );
};

export default EmailWrite;
