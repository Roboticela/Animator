// SPDX-License-Identifier: MIT
//! Android-only system UI “mosaic” modes: [SystemUiMosaic::Cinematic], [SystemUiMosaic::Standard], [SystemUiMosaic::Contoured].
//! On other platforms the plugin loads but commands return [crate::Error::Unavailable].

use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime};

pub use crate::error::{Error, Result};
pub use crate::models::{AndroidUiConfig, SystemUiMosaic};

#[cfg(target_os = "android")]
pub mod android_only;

mod commands;
mod error;
mod models;

/// On Android, use `app.android_ui()` to get the live handle. On other platforms this trait is not compiled.
#[cfg(target_os = "android")]
pub trait AndroidUiExt<R: Runtime> {
  fn android_ui(&self) -> Option<&android_only::AndroidUi<R>>;
}

#[cfg(target_os = "android")]
impl<R: Runtime, T: Manager<R>> AndroidUiExt<R> for T {
  fn android_ui(&self) -> Option<&android_only::AndroidUi<R>> {
    self.try_state::<android_only::AndroidUi<R>>().map(|s| s.inner())
  }
}

/// Register with [`tauri::Builder::plugin`], passing the same [`AndroidUiConfig`] you want at cold start.
pub fn init<R: Runtime>(config: AndroidUiConfig) -> TauriPlugin<R> {
  Builder::new("android-ui")
    .invoke_handler(tauri::generate_handler![commands::set_mosaic, commands::get_mosaic])
    .setup(move |app, api| {
      #[cfg(target_os = "android")]
      {
        let ui = android_only::init(&config, api)
          .map_err(|e| -> Box<dyn std::error::Error> { e.into() })?;
        app.manage(ui);
      }
      #[cfg(not(target_os = "android"))]
      {
        let _ = (app, api);
      }
      Ok(())
    })
    .build()
}
