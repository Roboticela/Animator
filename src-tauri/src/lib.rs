#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // Android: system bar presentation (Cinematic, Standard, Contoured) — see `tauri-plugin-android-ui`.
    .plugin(tauri_plugin_android_ui::init(
      tauri_plugin_android_ui::AndroidUiConfig::DEFAULT,
    ))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
