use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct EmailSettings {
    pub email_address: String,
    pub imap_server: String,
    pub imap_port: u16,
    pub smtp_server: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
}

#[derive(Serialize, Deserialize,Debug)]
pub(crate) struct Email {
    pub(crate) id: i32,
    pub(crate) sender: String,
    pub(crate) sent_date: String,
    pub(crate) subject: String,
    pub(crate) body: String,
    pub(crate) attachments: Option<String>,
    pub(crate) is_read: bool, // 使用 is_read 作为字段名称
}