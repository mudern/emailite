import React, { useState, useEffect } from 'react';
import { Input, Button, List, Select, message } from 'antd';
import { ReloadOutlined, UserOutlined, FormOutlined } from '@ant-design/icons';
import EmailPreview from '../component/EmailPreview.jsx';
import { useNavigate } from 'react-router-dom';
import Login from '../component/EmailSettings.jsx';
import { invoke } from '@tauri-apps/api';

const { Option } = Select;

const HomePage = () => {
    const [loginVisible, setLoginVisible] = useState(false);
    const [filterEmails, setFilterEmails] = useState([]);
    const [searchCategory, setSearchCategory] = useState('title');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                // 然后再从数据库中获取邮件列表
                const result = await invoke('get_email_list');
                setFilterEmails(result);
            } catch (error) {
                message.error('获取邮件失败');
                console.error("Failed to fetch emails:", error);
            }
        };

        fetchEmails();
    }, []);

    const handleSearch = async (value) => {
        if(value.trim() === ''){
            const result = await invoke('get_email_list');
            setFilterEmails(result);
            console.log("test")
        }
        else{
            const filtered = filterEmails.filter(email => {
                if (searchCategory === 'date') {
                    return email.sent_date.includes(value);
                } else if (searchCategory === 'body') {
                    return email.body ? email.body.includes(value) : ' '.includes(value);
                } else if (searchCategory === 'title') {
                    return email.subject.includes(value);
                } else if (searchCategory === 'sender') {
                    return email.sender.includes(value);
                }
                return false;
            });
            setFilterEmails(filtered);
        }
    };

    const handleRefresh = async () => {
        try {
            await invoke('load_mail_from_imap');
            const result = await invoke('get_email_list');
            setFilterEmails(result);
            message.success("获取邮件成功");
        } catch (error) {
            message.error('获取邮件失败');
            console.error("Failed to refresh emails:", error);
        }
    };

    const handleLogin = () => {
        setLoginVisible(true);
    };

    const handleCompose = () => {
        navigate('/email/write');
    };

    const handleClick = id => {
        navigate(`/email/${id}`);
    };

    const handleLoginClose = () => {
        setLoginVisible(false);
    };

    const handleCategoryChange = value => {
        setSearchCategory(value);
    };

    const preprocessEmails = (emails) => {
        return emails.map(email => ({
            ...email,
            body: email.body || ' ' // 如果 email.body 为空，使用一个空格
        }));
    };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Select
                    defaultValue="title"
                    onChange={handleCategoryChange}
                    style={{ width: 85, marginRight: '16px' }}
                >
                    <Option value="date">日期</Option>
                    <Option value="body">正文</Option>
                    <Option value="title">标题</Option>
                    <Option value="sender">发件人</Option>
                </Select>
                <Input.Search
                    placeholder="搜索邮件"
                    onSearch={handleSearch}
                    style={{ flex: 1, marginRight: '16px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={handleRefresh}><ReloadOutlined /></Button>
                    <Button onClick={handleLogin}><UserOutlined /></Button>
                    <Button type="primary" onClick={handleCompose}><FormOutlined /></Button>
                </div>
            </div>
            <List
                itemLayout="horizontal"
                dataSource={preprocessEmails(filterEmails)}
                renderItem={email => (
                    <EmailPreview key={email.id} email={email} onClick={() => handleClick(email.id)} />
                )}
            />
            <Login visible={loginVisible} onClose={handleLoginClose} />
        </>
    );
};

export default HomePage;