use rusqlite::params;

use crate::db;
use crate::db::init_db;
use crate::email::{fetch_emails, send_email};
use crate::models::{Email, EmailSettings};

#[tauri::command]
pub fn save_email_settings(settings: EmailSettings) -> Result<(), String> {
    let conn = init_db().map_err(|e| e.to_string())?;

    // 检查是否已经存在一条记录
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM email_settings",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    if count == 0 {
        // 如果没有记录，插入新数据
        conn.execute(
            "INSERT INTO email_settings (email_address, imap_server, imap_port, smtp_server, smtp_port, smtp_username, smtp_password)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                settings.email_address,
                settings.imap_server,
                settings.imap_port,
                settings.smtp_server,
                settings.smtp_port,
                settings.smtp_username,
                settings.smtp_password
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        // 如果有记录，更新已有记录
        conn.execute(
            "UPDATE email_settings SET email_address = ?1, imap_server = ?2, imap_port = ?3, smtp_server = ?4, smtp_port = ?5, smtp_username = ?6, smtp_password = ?7
             WHERE id = (SELECT id FROM email_settings LIMIT 1)",
            params![
                settings.email_address,
                settings.imap_server,
                settings.imap_port,
                settings.smtp_server,
                settings.smtp_port,
                settings.smtp_username,
                settings.smtp_password
            ],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn send_email_handler(email: Email) -> Result<(), String> {
    // 获取数据库连接
    let conn = db::init_db().map_err(|e| e.to_string())?;

    // 发送邮件
    send_email(&conn, email).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_email_list() -> Result<Vec<Email>, String> {
    let conn = db::init_db().map_err(|e| e.to_string())?;
    let emails = db::get_emails(&conn).map_err(|e| e.to_string())?;
    Ok(emails)
}

#[tauri::command]
pub fn mark_email_as_read(email_id: i32) -> Result<(), String> {
    let conn = db::init_db().map_err(|e| e.to_string())?;
    db::mark_as_read(&conn, email_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_email_by_id(email_id: i32) -> Result<Email, String> {
    // 初始化数据库连接
    let conn = db::init_db().map_err(|e| e.to_string())?;

    // 调用 db.rs 中的查询函数
    db::get_email_by_id_from_db(&conn, email_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_email_by_id(email_id: i32) -> Result<String, String> {
    // 初始化数据库连接
    let conn = init_db().map_err(|e| e.to_string())?;

    // 调用 db.rs 中的删除函数
    match db::delete_email_by_id_from_db(&conn, email_id) {
        Ok(rows_affected) => {
            if rows_affected > 0 {
                Ok("邮件删除成功".to_string())
            } else {
                Err("未找到对应的邮件".to_string())
            }
        },
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn load_mail_from_imap() -> Result<(), String> {
    // 初始化数据库连接
    let conn = init_db().map_err(|e| e.to_string())?;

    // 调用 fetch_emails 函数
    fetch_emails(&conn)
}

