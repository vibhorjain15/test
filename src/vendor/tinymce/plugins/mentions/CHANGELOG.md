# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 2.3.0 - 2021-08-27

### Added
- Added "profile" card feature to hover callback #TINY-6972

### Fixed
- Fixed "profile" cards not displaying the `fullName` when available #TINY-6972

## 2.2.1 - 2021-02-08

### Fixed
- Fixed hover cards not being visible in fullscreen mode #TINY-6688
- Fixed hover card not positioned correctly if the editor has scrolled #TINY-6689

## 2.2.0 - 2020-11-18

### Added
- Added new "profile" mentions select card with avatar, name and description #TINY-6506
- Added new `mentions_item_type` setting for specifying the type of item to use when displaying the mentions user list #TINY-6506
- Added new `mentions_min_chars` setting for configuring when mentions should activate while typing #TINY-6506

### Fixed
- Fixed mentions not converted to contenteditable=false elements when set via `editor.setContent()` #TINY-6413

## 2.1.0 - 2019-10-17

### Added
- Added the ability to include "extra" menu items that allow reloading with different search params. #MENTIONS-17

### Fixed
- Fixed select menu being hidden while changing selection and when hovering. #TINY-3752

## 2.0.1 - 2019-02-19

### Fixed
- Fixed mentions_select callback getting called multiple times. #TINY-3256
- Fixed issue with select menu remaining visible when removing the editor. #TINY-3256

## 2.0.0 - 2019-02-04

### Added
- Support for TinyMCE 5

## 1.1.1 - 2018-11-12

### Added
- Added highlight type-a-head for mentions matching. #TINY-1516

## 1.1.0 - 2018-02-01

### Improved
- Decreased plugin size by improving build steps.

## 1.0.6 - 2016-12-08

### Fixed
-  Fixed issue where the ui would be accessed directly instead of though a factory.

## 1.0.5 - 2017-08-17

### Changed
- Changed so the mentions menu is triggered on one character instead of two. #TINY-1186

## 1.0.4 - 2017-05-23

### Added
- Added functionality to add selected mention to the document by pressing the tab button. #TINY-1046

## 1.0.3 - 2016-12-13

### Fixed
-  Fixed incorrect positioning for menus when document had scroll and inline editor was used. #TINY-825

## 1.0.2 - 2016-10-25

### Added
- Added version detection logic that check if mentions is used with a compatible tinymce version. #TINY-639
