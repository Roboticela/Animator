// SPDX-License-Identifier: MIT

const COMMANDS: &[&str] = &["set_mosaic", "get_mosaic"];

fn main() {
  let result = tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .try_build();

  if !(cfg!(docsrs) && std::env::var("TARGET").unwrap().contains("android")) {
    result.expect("tauri android-ui plugin build");
  }
}
