use std::collections::HashMap;

use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;
use mailparse::{parse_mail, ParsedMail};
use native_tls::TlsConnector;
use rusqlite::Connection;

use crate::db::{get_all_email_ids, get_email_settings, save_email};
use crate::models::Email;
use crate::utils::generate_email_id;

pub fn send_email(conn: &Connection, email: Email) -> Result<(), String> {
    // 获取电子邮件设置
    let email_settings = get_email_settings(conn).map_err(|e| e.to_string())?;

    // 创建邮件消息
    let email_message = Message::builder()
        .from(email_settings.email_address.parse().unwrap())
        .to(email.sender.parse().unwrap())
        .subject(email.subject)
        .body(email.body)
        .map_err(|e| e.to_string())?;

    // 设置SMTP客户端
    let creds = Credentials::new(email_settings.smtp_username, email_settings.smtp_password);
    let mailer = SmtpTransport::relay(&email_settings.smtp_server)
        .map_err(|e| e.to_string())?
        .credentials(creds)
        .build();

    // 发送邮件
    mailer.send(&email_message).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn fetch_emails(conn: &Connection) -> Result<(), String> {
    // 获取电子邮件设置
    let email_settings = get_email_settings(conn).map_err(|e| e.to_string())?;

    // 创建 TLS 连接
    let tls = TlsConnector::builder().build().map_err(|e| e.to_string())?;
    let client = imap::connect(
        (email_settings.imap_server.as_str(), email_settings.imap_port),
        email_settings.imap_server.as_str(),
        &tls
    ).map_err(|e| e.to_string())?;

    // 登录到 IMAP 服务器
    let mut imap_session = client
        .login(&email_settings.email_address, &email_settings.smtp_password)
        .map_err(|e| e.0.to_string())?;

    // 选择收件箱
    imap_session.select("INBOX").map_err(|e| e.to_string())?;

    // 获取未读邮件
    let messages = imap_session.search("UNSEEN").map_err(|e| e.to_string())?;

    // 用于存储邮件
    let mut email_list = Vec::new();

    for message_id in messages.iter() {
        let messages = imap_session.fetch(message_id.to_string(), "RFC822").map_err(|e| e.to_string())?;
        let fetched_message = messages.iter().next().ok_or("No message found")?;
        let body = fetched_message.body().ok_or("No body found")?;

        // 解析邮件
        let email_parsed = parse_mail(body).map_err(|e| e.to_string())?;
        let email = parse_email(email_parsed)?;

        email_list.push(email);
    }

    // 获取数据库中所有邮件的唯一标识符
    let existing_email_ids = get_all_email_ids(conn).map_err(|e| e.to_string())?;

    // 过滤出唯一标识符不在数据库中的新邮件
    let new_emails: Vec<Email> = email_list.into_iter()
        .filter(|email| !existing_email_ids.contains(&generate_email_id(email)))
        .collect();

    // 保存新增的邮件
    for email in new_emails {
        save_email(conn, &email).map_err(|e| e.to_string())?;
    }

    // 关闭 IMAP 会话
    imap_session.logout().map_err(|e| e.to_string())?;

    Ok(())
}

fn parse_email(parsed_mail: ParsedMail) -> Result<Email, String> {
    // 从解析结果中提取发送者、主题和正文
    let headers: HashMap<String, String> = parsed_mail.headers
        .iter()
        .filter_map(|header| {
            let key = header.get_key_ref().to_ascii_lowercase();
            let value = header.get_value();
            Some((key, value))
        })
        .collect();

    let sender = headers.get("from").cloned().ok_or("Sender not found")?;
    let subject = headers.get("subject").cloned().unwrap_or_default();
    let sent_date = headers.get("date").cloned().unwrap_or_default();
    let body = extract_body_from_parsed_mail(&parsed_mail)?;

    Ok(Email {
        id: 0,  // 数据库自动生成 ID
        sender,
        sent_date,
        subject,
        body,
        attachments: None,  // 这里可以实现附件的提取逻辑
        is_read: false,
    })
}

fn extract_body_from_parsed_mail(parsed_mail: &ParsedMail) -> Result<String, String> {
    if parsed_mail.subparts.is_empty() {
        let body = parsed_mail.get_body().map_err(|e| e.to_string())?;
        return Ok(body);
    }

    for subpart in &parsed_mail.subparts {
        if let Ok(body) = subpart.get_body() {
            return Ok(body);
        }
    }

    Err("Failed to extract email body".to_string())
}