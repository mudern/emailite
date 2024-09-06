pub fn truncate_content(content: &str, max_length: usize) -> String {
    if content.chars().count() > max_length {
        let truncated: String = content.chars().take(max_length).collect();
        truncated + "…"
    } else {
        content.to_string()
    }
}