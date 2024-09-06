import React from 'react';
import {Card} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleTwoTone, CheckCircleTwoTone } from '@ant-design/icons';

const EmailPreview = ({ email, isRead }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`/email/${email.id}`);
    };
    // 将 sent_date 转换为 Date 对象并格式化为 yyyy-mm-dd hh:mm
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 使用 24 小时制
        });
    };
    return (
        <Card
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                marginBottom: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                position: 'relative', // 使绝对定位的图标生效
                height:'120px'
            }}
            hoverable
        >
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '16px',
            }}>
                {email.is_read
                    ? <CheckCircleTwoTone twoToneColor="#52c41a"/>
                    : <ExclamationCircleTwoTone twoToneColor="#faad14"/>}
            </div>
            <Card.Meta
                title={<span style={{fontSize: '16px', fontWeight: 'bold'}}>{email.subject}</span>}
                description={getPreview(email.body)}
            />
            <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                color: '#888',
                fontSize: '12px'
            }}>
                <div style={{
                    textAlign: 'right', // 确保内容靠右对齐
                }}>
                    <div>{email.sender}</div>
                    <div>{formatDateTime(email.sent_date)}</div>
                </div>
            </div>
        </Card>
    );
};

function getPreview(content) {
    // 确保 content 是一个字符串
    if (typeof content !== 'string') {
        throw new Error('Content must be a string');
    }

    // 截取最多 25 个字
    const maxLength = 35;

    // 对于中文字符的处理
    const contentLength = content.length;
    if (contentLength <= maxLength) {
        return content;
    }

    // 提取前 25 个字，并加上省略号
    // 可以根据需要使用不同的省略号符号
    return content.substring(0, maxLength) + '...';
}

export default EmailPreview;