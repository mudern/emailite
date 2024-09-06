use std::collections::HashSet;
use rusqlite::params;
use rusqlite::{Connection, Result};
use crate::models::{Email, EmailSettings};
use crate::utils::{truncate_content,generate_email_id};

pub(crate) fn init_db() -> Result<Connection> {
    let conn = Connection::open("sqlite.db")?;

    // 创建 email_settings 表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS email_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_address TEXT NOT NULL,
            imap_server TEXT NOT NULL,
            imap_port INTEGER NOT NULL,
            smtp_server TEXT NOT NULL,
            smtp_port INTEGER NOT NULL,
            smtp_username TEXT NOT NULL,
            smtp_password TEXT NOT NULL
        )",
        [],
    )?;

    // 创建 emails 表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            sent_date TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            attachments TEXT,
            is_read BOOLEAN NOT NULL DEFAULT 0
        )",
        [],
    )?;

    Ok(conn)
}

pub fn save_email(conn: &Connection, email: &Email) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO emails (sender, sent_date, subject, body, attachments, is_read)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            email.sender,
            email.sent_date,
            email.subject,
            email.body,
            email.attachments,
            email.is_read,
        ],
    )?;
    Ok(())
}

pub(crate) fn get_email_settings(conn: &Connection) -> Result<EmailSettings> {
    let mut stmt = conn.prepare(
        "SELECT email_address, imap_server, imap_port, smtp_server, smtp_port, smtp_username, smtp_password FROM email_settings LIMIT 1"
    )?;

    let email_settings = stmt.query_row([], |row| {
        Ok(EmailSettings {
            email_address: row.get(0)?,
            imap_server: row.get(1)?,
            imap_port: row.get(2)?,
            smtp_server: row.get(3)?,
            smtp_port: row.get(4)?,
            smtp_username: row.get(5)?,
            smtp_password: row.get(6)?,
        })
    })?;

    Ok(email_settings)
}

pub(crate) fn get_emails(conn: &Connection) -> Result<Vec<Email>> {
    let mut stmt = conn.prepare(
        "SELECT id, sender, sent_date, subject, body, attachments, is_read FROM emails"
    )?;
    let email_iter = stmt.query_map([], |row| {
        Ok(Email {
            id: row.get(0)?,
            sender: row.get(1)?,
            sent_date: row.get(2)?,
            subject: row.get(3)?,
            body: truncate_content(&row.get::<_, String>(4)?, 25),
            attachments: row.get(5)?,
            is_read: row.get(6)?, // 读取 is_read 字段
        })
    })?;

    let mut emails = Vec::new();
    for email in email_iter {
        emails.push(email?);
    }
    Ok(emails)
}

pub(crate) fn mark_as_read(conn: &Connection, email_id: i32) -> Result<()> {
    conn.execute(
        "UPDATE emails SET is_read = 1 WHERE id = ?",
        &[&email_id],
    )?;
    Ok(())
}

pub fn get_email_by_id_from_db(conn: &Connection, email_id: i32) -> Result<Email> {
    let mut stmt = conn.prepare(
        "SELECT id, sender, sent_date, subject, body, attachments, is_read FROM emails WHERE id = ?1"
    )?;

    let email = stmt.query_row(params![email_id], |row| {
        Ok(Email {
            id: row.get(0)?,
            sender: row.get(1)?,
            sent_date: row.get(2)?,
            subject: row.get(3)?,
            body: row.get(4)?,
            attachments: row.get(5)?,
            is_read: row.get(6)?,
        })
    })?;

    Ok(email)
}

pub fn delete_email_by_id_from_db(conn: &Connection, email_id: i32) -> Result<usize> {
    let mut stmt = conn.prepare("DELETE FROM emails WHERE id = ?1")?;
    let rows_affected = stmt.execute(params![email_id])?;

    Ok(rows_affected)
}

pub(crate) fn get_all_email_ids(conn: &Connection) -> Result<HashSet<String>> {
    let mut stmt = conn.prepare("SELECT sender, sent_date, subject, body FROM emails")?;
    let email_ids = stmt.query_map([], |row| {
        let sender: String = row.get(0)?;
        let sent_date: String = row.get(1)?;
        let subject: String = row.get(2)?;
        let body:String = row.get(3)?;
        Ok(generate_email_id(&Email {
            id: 0, // 不使用 id
            sender,
            sent_date,
            subject,
            body,
            attachments: None,
            is_read: false,
        }))
    })?;

    let mut ids = HashSet::new();
    for id in email_ids {
        ids.insert(id?);
    }

    Ok(ids)
}