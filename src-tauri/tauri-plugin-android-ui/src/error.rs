// SPDX-License-Identifier: MIT

use serde::{ser::Serializer, Serialize};

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("this API is only available on Android with the android-ui plugin active")]
  Unavailable,
  #[error("{0}")]
  Other(String),
}

impl Serialize for Error {
  fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
    serializer.serialize_str(self.to_string().as_ref())
  }
}
