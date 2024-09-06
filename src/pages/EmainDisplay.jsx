import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, message, Spin, Alert, Modal } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api';
import DOMPurify from 'dompurify';


const EmailDisplay = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [isModalVisible, setIsModalVisible] = React.useState(false);

    React.useEffect(() => {
        const fetchEmail = async () => {
            try {
                // 调用后端的 Tauri 命令获取邮件
                const fetchedEmail = await invoke('get_email_by_id', { emailId: parseInt(id) });
                setEmail(fetchedEmail);
                setLoading(false);

                // // 调用后端的 Tauri 命令标记邮件为已读
                // await invoke('mark_email_as_read', { emailId: parseInt(id) });
            } catch (err) {
                setError('Failed to fetch email');
                setLoading(false);
            }
        };

        fetchEmail();
    }, [id]);

    const handleBack = () => {
        navigate(-1); // 返回到上一个页面
    };

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        handleDelete(); // 执行删除操作
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleDelete = async () => {
        try {
            await invoke('delete_email_by_id', { emailId: parseInt(id) });
            message.success("删除成功");
            navigate(-1);
            // 处理删除后的操作，比如返回上一个页面
        } catch (error) {
            message.error("删除失败");
            console.log(error);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" />;
    }

    if (!email) {
        return <Alert message="Email not found" type="warning" />;
    }

    return (
        <div style={{ padding: '20px' }}>
            <Card
                style={{ marginBottom: '16px' }}
                bodyStyle={{ padding: '16px' }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '20px' }}>{email.sender}</div>
                    </div>
                    <div>
                        <Button
                            type="primary"
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBack}
                            style={{ marginRight: '8px' }}
                        >
                        </Button>
                        <Button
                            type="primary" danger
                            icon={<DeleteOutlined />}
                            onClick={showModal}
                        >
                        </Button>
                    </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                    <div>{email.sent_date}</div>
                </div>
            </Card>
            <Card
                bodyStyle={{ padding: '16px' }}
            >
                <h1>{email.subject}</h1>
                <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }}
                />
            </Card>

            <Modal
                title="确认删除"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="确认"
                cancelText="取消"
            >
                <p>你确定要删除这封邮件吗？</p>
            </Modal>
        </div>
    );
};

export default EmailDisplay;

