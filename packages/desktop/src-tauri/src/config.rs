use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub bot_host: String,
    pub bot_port: u16,
    pub music_folders: Vec<String>,
    pub theme: String,
    pub language: String,
    pub auto_connect: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            bot_host: "localhost".to_string(),
            bot_port: 3001,
            music_folders: Vec::new(),
            theme: "dark".to_string(),
            language: "en".to_string(),
            auto_connect: true,
        }
    }
}

fn config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("discord-music-bot");

    fs::create_dir_all(&config_dir).ok();
    config_dir.join("config.json")
}

#[tauri::command]
pub fn get_config() -> Result<AppConfig, String> {
    let path = config_path();

    if !path.exists() {
        let default_config = AppConfig::default();
        let json = serde_json::to_string_pretty(&default_config).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        return Ok(default_config);
    }

    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    let path = config_path();
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}
