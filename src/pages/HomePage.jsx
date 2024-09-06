import React, { useState, useEffect } from 'react';
import { Input, Button, List, Select, message, Pagination } from 'antd';
import { ReloadOutlined, UserOutlined, FormOutlined } from '@ant-design/icons';
import EmailPreview from '../component/EmailPreview.jsx';
import { useNavigate } from 'react-router-dom';
import Login from '../component/EmailSettings.jsx';
import { invoke } from '@tauri-apps/api';

const { Option } = Select;

const HomePage = () => {
    const [loginVisible, setLoginVisible] = useState(false);
    const [emails, setEmails] = useState([]); // 用于保存后端传来的邮件列表
    const [filterEmails, setFilterEmails] = useState([]);
    const [searchCategory, setSearchCategory] = useState('title');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const result = await invoke('get_email_list');
                const sortedEmails = result.sort((a, b) => new Date(b.sent_date) - new Date(a.sent_date));
                setEmails(sortedEmails); // 保存到 emails 变量
                setFilterEmails(sortedEmails);
            } catch (error) {
                message.error('获取邮件失败');
                console.error("Failed to fetch emails:", error);
            }
        };

        fetchEmails();
    }, []);

    const handleSearch = async (value) => {
        if (value.trim() === '') {
            setFilterEmails(emails);
        } else {
            const filtered = emails.filter(email => {
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
            const sortedEmails = result.sort((a, b) => new Date(b.sent_date) - new Date(a.sent_date));
            setEmails(sortedEmails); // 更新 emails 变量
            setFilterEmails(sortedEmails);
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

    // 分页处理
    const getPagedEmails = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filterEmails.slice(startIndex, endIndex);
    };

    const handlePageChange = (page, pageSize) => {
        setCurrentPage(page);
        setPageSize(pageSize);
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
                dataSource={getPagedEmails()} // 使用分页后的数据
                renderItem={email => (
                    <EmailPreview key={email.id} email={email} onClick={() => handleClick(email.id)} />
                )}
            />
            <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filterEmails.length}
                onChange={handlePageChange}
                style={{ textAlign: 'center', marginTop: '16px' }}
            />
            <Login visible={loginVisible} onClose={handleLoginClose} />
        </>
    );
};

export default HomePage;