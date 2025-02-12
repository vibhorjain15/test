# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.0.2 - 2021-06-23

### Fixed
- The client-side PDF exporter would fail to export when a circular reference was present during JSON serialization #TINY-7567

## 1.0.1 - 2021-05-24

### Fixed
- Content was lost in the PDF output in some cases due to a compiler issue #TINY-7497

## 1.0.0 - 2021-05-06

### Added
- Added translations for export strings #TINY-7342 #TINY-7323

### Improved
- Improved error handling when a PDF conversion failure occurs due to browser limitations #TINY-7147

### Changed
- Changed how image proxy errors are handled to gracefully fail and render a transparent image when an image proxy error occurs #TINY-7050

### Fixed
- Fixed an issue where internal document links did not navigate within the client-side PDF exporter output #TINY-7051

## 0.1.0 - 2020-10-09

### Added
- Initial release
