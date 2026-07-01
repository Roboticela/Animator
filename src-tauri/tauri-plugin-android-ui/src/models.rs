// SPDX-License-Identifier: MIT

use serde::{Deserialize, Serialize};

/// **Cinematic** — true immersive fullscreen: system controls stay hidden until the user swipes; OS reveals them temporarily.
/// **Standard** (default) — system status and navigation bars stay visible; content is laid out below them (no overlap).
/// **Contoured** — controls stay hidden, but the web content is letterboxed to the “safe” rectangle; the regions where bars would be are filled with your chosen color so the whole display reads as one designed surface.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SystemUiMosaic {
  Cinematic,
  Standard,
  Contoured,
}

/// Startup options for [crate::init].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct AndroidUiConfig {
  /// Defaults to [SystemUiMosaic::Standard] if you use [AndroidUiConfig::DEFAULT].
  pub default_mosaic: SystemUiMosaic,
  /// `0xAARRGGBB` fill color for the top and bottom “letter” zones in [SystemUiMosaic::Contoured].
  pub contoured_letterbox_argb: u32,
}

impl AndroidUiConfig {
  /// Standard system chrome on launch, dark neutral letterbox color for [SystemUiMosaic::Contoured].
  pub const DEFAULT: Self = Self {
    default_mosaic: SystemUiMosaic::Standard,
    contoured_letterbox_argb: 0xFF0F0F0F,
  };
}
