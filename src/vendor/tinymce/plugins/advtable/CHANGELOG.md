# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.2.0 - 2021-10-11

### Added
- Added `getRowType` and `getColType` properties to the series generator `info` argument #TINY-7970

### Fixed
- Toggling a series column would remove any other locked columns #TINY-7778
- The selection could be placed in an invalid location when a series column was updated #TINY-7911

## 1.1.0 - 2021-08-27

### Added
- Added new series column feature #TINY-6005

### Changed
- Moved the translations from core #TINY-7430

### Fixed
- Prevent sorting of locked column cells when sorting by row #TINY-7693

## 1.0.2 - 2021-02-09

### Fixed
- Fixed an issue where the `TableModified` event was not fired when sorting a table #TINY-6642

## 1.0.1 - 2020-10-09

### Fixed
- Fixed compatibility issue with TinyMCE 5.5 or higher #TINY-6492

## 1.0.0 - 2019-11-29

### Added
- Initial release
