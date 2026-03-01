use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;
use lofty::file::AudioFile;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalTrack {
    pub file_path: String,
    pub file_name: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration: Option<u64>,
    pub size: u64,
    /// "audio" or "video"
    pub media_type: String,
}

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma", "opus"];
const VIDEO_EXTENSIONS: &[&str] = &["mp4", "webm", "mkv", "avi", "mov", "flv", "ogv", "3gp"];

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn is_video_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| VIDEO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn is_media_file(path: &Path) -> bool {
    is_audio_file(path) || is_video_file(path)
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

/// Extract duration in seconds using the lofty crate.
/// Returns None if the file cannot be parsed or has no duration info.
fn extract_duration(path: &Path) -> Option<u64> {
    let tagged_file = lofty::read_from_path(path).ok()?;
    let duration = tagged_file.properties().duration();
    let secs = duration.as_secs();
    if secs > 0 { Some(secs) } else { None }
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

        if entry_path.is_file() && is_media_file(entry_path) {
            let file_name = entry_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

            let media_type = if is_video_file(entry_path) {
                "video".to_string()
            } else {
                "audio".to_string()
            };

            let (title, artist, album) = extract_metadata(entry_path);
            let duration = extract_duration(entry_path);

            tracks.push(LocalTrack {
                file_path: entry_path.to_string_lossy().to_string(),
                file_name,
                title,
                artist,
                album,
                duration,
                size,
                media_type,
            });
        }
    }

    Ok(tracks)
}

/// Resolve a list of dropped paths (mix of files and directories) into tracks.
/// Files are checked individually; directories are scanned recursively.
#[tauri::command]
pub async fn resolve_dropped_paths(paths: Vec<String>) -> Result<Vec<LocalTrack>, String> {
    let mut tracks = Vec::new();

    for raw_path in &paths {
        let p = Path::new(raw_path);

        if !p.exists() {
            continue;
        }

        if p.is_dir() {
            // Recursively scan the directory for media files
            for entry in WalkDir::new(p)
                .follow_links(true)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                let entry_path = entry.path();
                if entry_path.is_file() && is_media_file(entry_path) {
                    tracks.push(build_track(entry_path, &entry));
                }
            }
        } else if p.is_file() && is_media_file(p) {
            // Single media file
            if let Ok(entry) = WalkDir::new(p).into_iter().next().unwrap() {
                tracks.push(build_track(p, &entry));
            }
        }
    }

    Ok(tracks)
}

fn build_track(path: &Path, entry: &walkdir::DirEntry) -> LocalTrack {
    let file_name = path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
    let media_type = if is_video_file(path) {
        "video".to_string()
    } else {
        "audio".to_string()
    };
    let (title, artist, album) = extract_metadata(path);
    let duration = extract_duration(path);

    LocalTrack {
        file_path: path.to_string_lossy().to_string(),
        file_name,
        title,
        artist,
        album,
        duration,
        size,
        media_type,
    }
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
