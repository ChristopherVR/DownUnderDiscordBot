use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, Event, EventKind};
use serde::Serialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma", "opus"];

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

#[derive(Debug, Clone, Serialize)]
pub struct FileChangeEvent {
    pub kind: String,       // "create", "modify", "remove"
    pub path: String,
    pub file_name: String,
    pub folder: String,
}

pub struct WatcherState {
    watchers: HashMap<PathBuf, RecommendedWatcher>,
}

impl Default for WatcherState {
    fn default() -> Self {
        Self {
            watchers: HashMap::new(),
        }
    }
}

#[tauri::command]
pub fn watch_folder(
    app: AppHandle,
    state: State<'_, Mutex<WatcherState>>,
    path: String,
) -> Result<(), String> {
    let folder = PathBuf::from(&path);

    if !folder.exists() || !folder.is_dir() {
        return Err(format!("Invalid directory: {}", path));
    }

    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;

    // Already watching this folder
    if watcher_state.watchers.contains_key(&folder) {
        return Ok(());
    }

    let watched_folder = path.clone();
    let app_handle = app.clone();

    let mut watcher = RecommendedWatcher::new(
        move |result: Result<Event, notify::Error>| {
            if let Ok(event) = result {
                let kind_str = match event.kind {
                    EventKind::Create(_) => Some("create"),
                    EventKind::Modify(_) => Some("modify"),
                    EventKind::Remove(_) => Some("remove"),
                    _ => None,
                };

                if let Some(kind) = kind_str {
                    for event_path in &event.paths {
                        if event_path.is_dir() || !is_audio_file(event_path) {
                            continue;
                        }

                        let file_name = event_path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();

                        let change = FileChangeEvent {
                            kind: kind.to_string(),
                            path: event_path.to_string_lossy().to_string(),
                            file_name,
                            folder: watched_folder.clone(),
                        };

                        let _ = app_handle.emit("music-folder-changed", &change);
                    }
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(&folder, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch folder: {}", e))?;

    watcher_state.watchers.insert(folder, watcher);

    Ok(())
}

#[tauri::command]
pub fn unwatch_folder(
    state: State<'_, Mutex<WatcherState>>,
    path: String,
) -> Result<(), String> {
    let folder = PathBuf::from(&path);
    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;

    if let Some(mut watcher) = watcher_state.watchers.remove(&folder) {
        let _ = watcher.unwatch(&folder);
    }

    Ok(())
}

#[tauri::command]
pub fn unwatch_all(
    state: State<'_, Mutex<WatcherState>>,
) -> Result<(), String> {
    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;
    watcher_state.watchers.clear();
    Ok(())
}
