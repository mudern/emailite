// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod handlers;
mod models;
mod utils;
mod email;

use tauri::Manager;
use crate::db::init_db;
use crate::handlers::{save_email_settings, get_email_list, send_email_handler, get_email_by_id, delete_email_by_id, load_mail_from_imap, mark_email_as_read};

fn main() {
    // 初始化数据库
    if let Err(e) = init_db() {
        eprintln!("Failed to initialize the database: {}", e);
        return;
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_email_settings, get_email_list,
            send_email_handler,get_email_by_id,delete_email_by_id,
            load_mail_from_imap,mark_email_as_read
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}