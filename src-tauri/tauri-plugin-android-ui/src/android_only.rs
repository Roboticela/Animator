// SPDX-License-Identifier: MIT
//! Android bridge for `tauri-plugin-android-ui` (Tauri 2.10+ uses `PluginHandle<R>` and `PluginApi<R, C>`.)

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use tauri::plugin::PluginHandle;
use tauri::Runtime;

use crate::error::Result;
use crate::models::{AndroidUiConfig, SystemUiMosaic};

pub const PLUGIN_ID: &str = "app.tauri.androidui";

/// Managed handle used by [crate::AndroidUiExt] (Android only; state is absent on other platforms).
pub struct AndroidUi<R: Runtime>(pub PluginHandle<R>);

impl<R: Runtime> AndroidUi<R> {
  pub fn set_mosaic(&self, mosaic: SystemUiMosaic) -> Result<()> {
    self
      .0
      .run_mobile_plugin("setMosaic", SetMosaic { mosaic })
      .map_err(|e| crate::Error::Other(e.to_string()))
  }

  pub fn get_mosaic(&self) -> Result<SystemUiMosaic> {
    self
      .0
      .run_mobile_plugin("getMosaic", ())
      .map(|r: GetMosaicPayload| r.mosaic)
      .map_err(|e| crate::Error::Other(e.to_string()))
  }

  fn set_letterbox_argb(&self, contoured_letterbox_argb: u32) -> Result<()> {
    self
      .0
      .run_mobile_plugin(
        "setContouredLetterboxArgb",
        ContouredColor {
          // JSON numbers are IEEE doubles; Java/Kotlin `int` is signed. Send the same
          // 0xAARRGGBB bit pattern as a signed i32 so values like 0xFF______ parse.
          contoured_letterbox_argb: contoured_letterbox_argb as i32,
        },
      )
      .map_err(|e| crate::Error::Other(e.to_string()))
  }
}

pub fn init<R: Runtime, C: DeserializeOwned>(
  config: &AndroidUiConfig,
  api: tauri::plugin::PluginApi<R, C>,
) -> Result<AndroidUi<R>> {
  let handle = api
    .register_android_plugin(PLUGIN_ID, "AndroidUiPlugin")
    .map_err(|e| crate::Error::Other(e.to_string()))?;
  let android = AndroidUi(handle);
  android.set_letterbox_argb(config.contoured_letterbox_argb)?;
  let _ = android.set_mosaic(config.default_mosaic);
  Ok(android)
}

#[derive(Serialize)]
struct SetMosaic {
  mosaic: SystemUiMosaic,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ContouredColor {
  contoured_letterbox_argb: i32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetMosaicPayload {
  mosaic: SystemUiMosaic,
}
