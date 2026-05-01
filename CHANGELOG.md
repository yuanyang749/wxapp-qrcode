# Changelog

All notable changes to this project will be documented in this file.

## v1.1.0 - 2026-05-01

### Added

- Added QR rendering options for custom foreground and background colors.
- Added linear gradient support with configurable start color, end color, and angle.
- Added custom logo overlay support for local assets and remote image URLs.
- Added GitHub issue templates, a pull request template, and a security policy.

### Changed

- Rewrote the README to better document installation, API usage, and rendering options.
- Improved the demo page so new rendering capabilities can be tested directly.
- Updated the QR drawing API to support extensible options while keeping existing calls compatible.

### Fixed

- Fixed local logo loading issues in the Mini Program demo environment.
- Improved canvas export and drawing area handling to reduce clipping and extra whitespace.
- Resolved several historical issues and shipped requested QR customization features.
