use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalTrack {
    pub file_path: String,
    pub file_name: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration: Option<u64>,
    pub size: u64,
}

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma", "opus"];

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn extract_metadata(path: &Path) -> (String, String, Option<String>) {
    // Try to read ID3 tags
    if let Ok(tag) = audiotags::Tag::new().read_from_path(path) {
        let title = tag
            .title()
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                path.file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string()
            });
        let artist = tag
            .artist()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unknown Artist".to_string());
        let album = tag.album_title().map(|s| s.to_string());

        (title, artist, album)
    } else {
        let title = path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        (title, "Unknown Artist".to_string(), None)
    }
}

#[tauri::command]
pub async fn scan_music_folder(path: String) -> Result<Vec<LocalTrack>, String> {
    let folder_path = Path::new(&path);

    if !folder_path.exists() {
        return Err(format!("Folder does not exist: {}", path));
    }

    if !folder_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut tracks = Vec::new();

    for entry in WalkDir::new(folder_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();

        if entry_path.is_file() && is_audio_file(entry_path) {
            let file_name = entry_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

            let (title, artist, album) = extract_metadata(entry_path);

            tracks.push(LocalTrack {
                file_path: entry_path.to_string_lossy().to_string(),
                file_name,
                title,
                artist,
                album,
                duration: None, // audiotags doesn't provide duration; frontend can get it
                size,
            });
        }
    }

    Ok(tracks)
}

#[tauri::command]
pub fn get_default_music_folders() -> Vec<String> {
    let mut folders = Vec::new();

    if let Some(audio_dir) = dirs::audio_dir() {
        folders.push(audio_dir.to_string_lossy().to_string());
    }

    // Windows Music folder
    if let Some(home) = dirs::home_dir() {
        let music = home.join("Music");
        if music.exists() {
            let music_str = music.to_string_lossy().to_string();
            if !folders.contains(&music_str) {
                folders.push(music_str);
            }
        }
    }

    // Common custom locations
    let custom_paths = vec!["D:\\Music", "E:\\Music"];
    for custom in custom_paths {
        if Path::new(custom).exists() && !folders.contains(&custom.to_string()) {
            folders.push(custom.to_string());
        }
    }

    folders
}
