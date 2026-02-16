#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod file_scanner;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::connect_to_bot,
            commands::get_bot_status,
            commands::health_check,
            file_scanner::scan_music_folder,
            file_scanner::get_default_music_folders,
            config::get_config,
            config::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
