use rand::Rng;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

use crate::config;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "state", rename_all = "camelCase")]
pub enum BotRunStatus {
    Stopped,
    Starting,
    Running { port: u16 },
    Crashed { message: String },
}

#[derive(Serialize, Clone)]
struct BotLogLine {
    stream: &'static str,
    line: String,
}

pub struct BotProcessState {
    child: Option<CommandChild>,
    status: BotRunStatus,
}

impl Default for BotProcessState {
    fn default() -> Self {
        Self {
            child: None,
            status: BotRunStatus::Stopped,
        }
    }
}

fn generate_secret() -> String {
    let mut rng = rand::thread_rng();
    let bytes: [u8; 32] = rng.r#gen();
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

/// ffmpeg is shipped as a plain resource (not a sidecar - it's spawned by the
/// bot's own child process, never by Tauri directly), under a per-target-triple
/// subdirectory written by build-sidecar.mjs. Since a given installer only
/// ever bundles the one subdirectory matching the platform it was built for,
/// resolving "whichever single subdirectory exists" avoids needing to
/// reconstruct the exact triple string in Rust.
fn resolve_ffmpeg_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let ffmpeg_root = app
        .path()
        .resolve("resources/ffmpeg", tauri::path::BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    let entry = std::fs::read_dir(&ffmpeg_root)
        .map_err(|e| format!("Could not read ffmpeg resource dir: {e}"))?
        .filter_map(|e| e.ok())
        .find(|e| e.path().is_dir())
        .ok_or("No ffmpeg resource directory found")?;
    let exe_name = if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" };
    Ok(entry.path().join(exe_name))
}

#[tauri::command]
pub async fn start_local_bot(
    app: AppHandle,
    state: State<'_, Mutex<BotProcessState>>,
) -> Result<BotRunStatus, String> {
    let mut app_config = config::get_config()?;
    let mut local = app_config
        .local_bot
        .clone()
        .ok_or_else(|| "Local bot is not configured".to_string())?;

    if local.client_token.trim().is_empty() {
        return Err("A Discord bot token is required".to_string());
    }

    if local.jwt_secret.is_none() {
        local.jwt_secret = Some(generate_secret());
        app_config.local_bot = Some(local.clone());
        config::save_config(app_config)?;
    }
    let jwt_secret = local.jwt_secret.clone().unwrap();
    let port = if local.port == 0 { 3000 } else { local.port };

    let resource_dir = app
        .path()
        .resolve("resources/bot", tauri::path::BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    let index_js = resource_dir.join("index.js");

    let ffmpeg_path = resolve_ffmpeg_path(&app)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&ffmpeg_path, std::fs::Permissions::from_mode(0o755));
    }

    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_dir = data_dir.join("bot");
    std::fs::create_dir_all(&db_dir).map_err(|e| e.to_string())?;
    let database_url = format!("file:{}", db_dir.join("data.db").display());

    let mut command = app
        .shell()
        .sidecar("bot-node")
        .map_err(|e| e.to_string())?
        .args([index_js.to_string_lossy().to_string()])
        .current_dir(resource_dir)
        // The bot's logger loads pino-pretty (a devDependency, deliberately
        // not shipped alongside this sidecar) whenever NODE_ENV isn't
        // "production" - match how the Docker image runs it.
        .env("NODE_ENV", "production")
        .env("CLIENT_TOKEN", &local.client_token)
        .env("JWT_SECRET", &jwt_secret)
        .env("PORT", port.to_string())
        .env("DATABASE_URL", &database_url)
        .env("DISABLE_SPA", "1")
        .env("STATE_BACKEND", "memory")
        .env("FFMPEG_PATH", ffmpeg_path.to_string_lossy().to_string());
    // YT_DLP_PATH is deliberately not set - the bundled local bot doesn't
    // ship yt-dlp (see docs/desktop.md), so that fallback stays unavailable.

    if let Some(guild_id) = local.guild_id.as_ref().filter(|v| !v.trim().is_empty()) {
        command = command.env("GUILD_ID", guild_id);
    }
    if let Some(id) = local.spotify_client_id.as_ref().filter(|v| !v.trim().is_empty()) {
        command = command.env("SPOTIFY_CLIENT_ID", id);
    }
    if let Some(secret) = local.spotify_client_secret.as_ref().filter(|v| !v.trim().is_empty()) {
        command = command.env("SPOTIFY_CLIENT_SECRET", secret);
    }

    let (mut rx, child) = command.spawn().map_err(|e| e.to_string())?;

    {
        let mut s = state.lock().map_err(|_| "bot process state poisoned".to_string())?;
        s.child = Some(child);
        s.status = BotRunStatus::Starting;
    }

    let app_for_task = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let _ = app_for_task.emit(
                        "bot-log",
                        BotLogLine { stream: "stdout", line: String::from_utf8_lossy(&bytes).to_string() },
                    );
                }
                CommandEvent::Stderr(bytes) => {
                    let _ = app_for_task.emit(
                        "bot-log",
                        BotLogLine { stream: "stderr", line: String::from_utf8_lossy(&bytes).to_string() },
                    );
                }
                CommandEvent::Terminated(payload) => {
                    let state = app_for_task.state::<Mutex<BotProcessState>>();
                    let mut s = state.lock().unwrap();
                    let still_running = matches!(s.status, BotRunStatus::Running { .. } | BotRunStatus::Starting);
                    s.child = None;
                    if still_running {
                        let message = format!("Bot process exited unexpectedly (code {:?})", payload.code);
                        s.status = BotRunStatus::Crashed { message: message.clone() };
                        let _ = app_for_task.emit("bot-crashed", serde_json::json!({ "message": message }));
                    }
                }
                _ => {}
            }
        }
    });

    let health_url = format!("http://127.0.0.1:{port}/api/health");
    let client = reqwest::Client::new();
    for _ in 0..60 {
        if client.get(&health_url).send().await.is_ok() {
            let mut s = state.lock().map_err(|_| "bot process state poisoned".to_string())?;
            s.status = BotRunStatus::Running { port };
            return Ok(s.status.clone());
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    Err("Bot did not become healthy within 30 seconds".to_string())
}

#[tauri::command]
pub fn stop_local_bot(state: State<'_, Mutex<BotProcessState>>) -> Result<(), String> {
    let mut s = state.lock().map_err(|_| "bot process state poisoned".to_string())?;
    if let Some(child) = s.child.take() {
        child.kill().map_err(|e| e.to_string())?;
    }
    s.status = BotRunStatus::Stopped;
    Ok(())
}

#[tauri::command]
pub fn get_local_bot_status(state: State<'_, Mutex<BotProcessState>>) -> Result<BotRunStatus, String> {
    let s = state.lock().map_err(|_| "bot process state poisoned".to_string())?;
    Ok(s.status.clone())
}
