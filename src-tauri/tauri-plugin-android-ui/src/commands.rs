// SPDX-License-Identifier: MIT

use tauri::{AppHandle, Manager, Runtime};

use crate::error::Result;
use crate::models::SystemUiMosaic;

#[tauri::command]
pub async fn set_mosaic<R: Runtime>(app: AppHandle<R>, mosaic: SystemUiMosaic) -> Result<()> {
  #[cfg(target_os = "android")]
  {
    if let Some(ui) = app.try_state::<crate::android_only::AndroidUi<R>>() {
      return ui.set_mosaic(mosaic);
    }
  }
  let _ = (app, mosaic);
  Err(crate::Error::Unavailable)
}

#[tauri::command]
pub async fn get_mosaic<R: Runtime>(app: AppHandle<R>) -> Result<SystemUiMosaic> {
  #[cfg(target_os = "android")]
  {
    if let Some(ui) = app.try_state::<crate::android_only::AndroidUi<R>>() {
      return ui.get_mosaic();
    }
  }
  let _ = app;
  Err(crate::Error::Unavailable)
}
