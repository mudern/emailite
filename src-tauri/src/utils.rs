use std::collections::HashSet;
use crate::models::Email;

pub fn truncate_content(content: &str, max_length: usize) -> String {
    if content.chars().count() > max_length {
        let truncated: String = content.chars().take(max_length).collect();
        truncated + "…"
    } else {
        content.to_string()
    }
}

// 用于生成邮件的唯一标识符
fn generate_email_id(email: &Email) -> String {
    format!("{}|{}|{}", email.sender, email.sent_date, email.subject)
}

// 去重邮件列表
pub fn deduplicate_emails(emails: Vec<Email>) -> Vec<Email> {
    let mut seen = HashSet::new();
    let mut unique_emails = Vec::new();

    for email in emails {
        let email_id = generate_email_id(&email);
        if !seen.contains(&email_id) {
            seen.insert(email_id);
            unique_emails.push(email);
        }
    }

    unique_emails
}