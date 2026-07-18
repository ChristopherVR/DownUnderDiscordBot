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
    // Older config.json files predate this field entirely.
    #[serde(default)]
    pub local_bot: Option<LocalBotConfig>,
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
            local_bot: None,
        }
    }
}

/// Settings for the bundled bot sidecar (Settings > "Run Bot Locally").
/// Stored in plaintext alongside the rest of this file's settings, matching
/// this app's existing config-storage precedent (no OS keychain is used
/// anywhere yet) - `client_token`/`spotify_client_secret` are the first
/// genuinely sensitive values to land here, worth knowing if that changes.
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocalBotConfig {
    pub client_token: String,
    pub guild_id: Option<String>,
    pub port: u16,
    pub spotify_client_id: Option<String>,
    pub spotify_client_secret: Option<String>,
    /// Generated once on first start and persisted thereafter - the bot
    /// process exits immediately if this env var is unset.
    pub jwt_secret: Option<String>,
}

/// Narrow accessors for just the `local_bot` slice of AppConfig - JS only
/// ever needs this piece, and going through the generic get_config/
/// save_config commands would require reconstructing (and risk clobbering)
/// every other settings field this file stores, none of which the frontend
/// currently reads or writes at all.
#[tauri::command]
pub fn get_local_bot_config() -> Result<Option<LocalBotConfig>, String> {
    Ok(get_config()?.local_bot)
}

#[tauri::command]
pub fn save_local_bot_config(mut config: LocalBotConfig) -> Result<(), String> {
    let mut app_config = get_config()?;
    // The frontend never sends jwt_secret (it doesn't know it) - preserve
    // whatever was already persisted so a routine settings save doesn't
    // force a fresh secret (and thus new auth tokens) on every save.
    if config.jwt_secret.is_none() {
        config.jwt_secret = app_config.local_bot.as_ref().and_then(|lb| lb.jwt_secret.clone());
    }
    app_config.local_bot = Some(config);
    save_config(app_config)
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
