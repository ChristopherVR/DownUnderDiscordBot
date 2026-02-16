use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BotConnection {
    pub host: String,
    pub port: u16,
    pub connected: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BotStatus {
    pub ok: bool,
    pub message: String,
}

#[tauri::command]
pub async fn connect_to_bot(host: String, port: u16) -> Result<BotConnection, String> {
    let url = format!("http://{}:{}/api/health", host, port);

    match reqwest::get(&url).await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(BotConnection {
                    host,
                    port,
                    connected: true,
                })
            } else {
                Err(format!("Bot API returned status: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Failed to connect: {}", e)),
    }
}

#[tauri::command]
pub async fn get_bot_status(host: String, port: u16) -> Result<serde_json::Value, String> {
    let url = format!("http://{}:{}/api/state", host, port);

    match reqwest::get(&url).await {
        Ok(response) => response.json().await.map_err(|e| e.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn health_check(host: String, port: u16) -> Result<BotStatus, String> {
    let url = format!("http://{}:{}/api/health", host, port);

    match reqwest::get(&url).await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(BotStatus {
                    ok: true,
                    message: "Bot is online".to_string(),
                })
            } else {
                Ok(BotStatus {
                    ok: false,
                    message: format!("Bot returned status: {}", response.status()),
                })
            }
        }
        Err(e) => Ok(BotStatus {
            ok: false,
            message: format!("Connection failed: {}", e),
        }),
    }
}
