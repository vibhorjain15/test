# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 2.5.1 - 2022-04-27

### Fixed
- Editor focus was incorrectly changed when spellchecking multiple editors after scrolling #TINY-8560

## 2.5.0 - 2021-10-11

### Improved
- The `SpellcheckerIgnoreAll` event now includes a `language` field #TINY-7760

### Fixed
- "Ignore all" actions would incorrectly ignore instances of the selected word that were in a different language #TINY-7760

## 2.4.1 - 2021-09-06

### Fixed
- Deactivating as-you-type mode could sometimes lead to incorrect words still getting highlighted #TINY-7923

## 2.4.0 - 2021-08-27

### Added
- The spellchecker dialog now supports navigating to the next and previous words #TINY-7754

### Improved
- Improved the error messages for the `SpellcheckError` event #TINY-7723

### Changed
- The `language` toolbar button has been moved out of the Spell Checker Pro plugin and into the core editor (from version 5.9.0 and above) #TINY-7570
- Moved language code validation from the client to the server #TINY-7114
- Upgraded to use version 2 of the spelling service API #TINY-7722
- The "Change" button text in the spellchecker dialog has been changed to "Accept" #TINY-7754

### Fixed
- Links with a URL as the text content will no longer be spellchecked #TINY-4891
- Resizing the editor with as-you-type mode enabled wouldn't spellcheck words that came into view #TINY-7787

## 2.3.2 - 2021-06-23

### Fixed
- Entering `hasOwnProperty` into the editor was throwing exceptions #TINY-7525

## 2.3.1 - 2021-05-06

### Fixed
- Fixed spellchecking not running when editor content is changed programmatically #TINY-6616
- Fixed English medical variants incorrectly falling back to regular English #TINY-7431
- Fixed `en_UK` and `en_BR` incorrectly spellchecking as US English instead of UK English #TINY-7431
- Fixed menu items sometimes not rendering as toggled due to language codes using a case sensitive comparison #TINY-7158

## 2.3.0 - 2021-02-09

### Added
- New `addIgnoredWords` API for adding words to the ignore list #TINY-6576
- New `getLanguage` and `setLanguage` API methods #TINY-6416
- New `mceSpellcheckDialogClose` command to close the spellchecker dialog #TINY-6416
- New `enable` and `disable` API methods for turning the spellchecker on and off #TINY-6416
- New `SpellcheckerLanguageChanged` event fired whenever the language is changed #TINY-6416

### Improved
- The `spellchecker_ignore_list` setting now accepts arrays of words per language #TINY-6576

### Changed
- The `spellchecker_whitelist` setting has been renamed to `spellchecker_ignore_list`. The old setting will continue to work as a fallback #TINY-6576

### Fixed
- Fixed a bug where it was possible to open multiple instances of the spellchecker dialog #TINY-6416
- Fixed a regression that caused errors to be thrown if the editor was destroyed while spellchecking #TINY-6799
- Fixed an issue where the spellchecker would incorrectly check content inside of special elements such as `style` #TINY-6457

## 2.2.0 - 2020-11-30

### Improvement
- The spellchecker dialog now opens faster when checking large documents #TINY-6438
- The spellchecker dialog can now be moved around and does not block access to editor content #TINY-5944

### Fixed
- Fixed the "Ignore All" action throwing an exception on words containing certain characters #TINY-6708
- Fixed the spellchecker dialog not checking incorrect words outside of the window viewport #TINY-6185
- Fixed the spellchecker as-you-type functionality interfering with the dialog #TINY-6694

## 2.1.0 - 2020-09-29

### Improvement
- Updated the dialog UI to accommodate wider buttons for languages with longer strings by removing the unnecessary cancel button #TINY-6184

### Fixed
- Fixed the `spellcheck_dialog` button incorrectly rendering as a split button in TinyMCE 4 #TINY-6185

## 2.0.2 - 2020-05-27

### Fixed
- Fixed performance issues in large documents with lots of tables #TINY-4862
- Fixed spellchecking not running while scrolling in inline mode #TINY-5964
- Fixed spellchecking performance issues when using the autoresize plugin #TINY-5964
- Fixed missing spellcheck menu icons #TINY-5990
- Fixed the selection incorrectly moving inside a `contenteditable="false"` element #TINY-6034
- Fixed missing translations for new strings added in 2.0.0 #TINY-6056

## 2.0.1 - 2020-04-27

### Fixed
- Fixed the context menu incorrectly positioning on a scrolled page in TinyMCE 4 #POWERSPELL-14
- Fixed an unhandled exception thrown when enabling spellchecking in inline mode for TinyMCE 4 #POWERSPELL-15

## 2.0.0 - 2020-02-13

### Added
- Added multi-lingual spellchecking #POWERSPELL-1

### Changed
- Rewrote spellchecking engine #POWERSPELL-1

## 1.1.0 - 2019-04-16

### Added
- Added language toolbar button to mark selected content as a specific language. #TINY-2992

## 0.11.0 - 2018-10-18

### Added
- Spellcheck on Shift+Enter. #TINY-1876

## 0.10.0 - 2018-02-01

### Improved
- Decreased plugin size by improving build steps.

## 0.9.11 - 2017-12-08

### Changed
- Only spellcheck when the selection is collapsed. #TINY-1299

## 0.9.10 - 2017-08-17

### Changed
- Changed the default language code from en to en_us and "US English" is not en_us. #TINY-1178

## 0.9.9 - 2017-05-23

### Added
- Added aria labels to spellchecking dialog to improve a11y. #TINY-1048

## 0.9.8 - 2017-05-23

### Added
- Added new SpellcheckerIgnore/SpellcheckerIgnoreAll events. #TINY-1047

## 0.9.7 - 2016-12-13

### Fixed
- Fixed so the context menu key can be used on keyboards to access corrections. #TINY-735

## 0.9.6 - 2016-10-27

### Added
- Added version detection logic that check if this plugin is used with a compatible tinymce version. #TINY-639
- Added an option "spellchecker_active" set the default spellchecker active state. #TINY-646

## 0.9.5 - 2016-09-22

### Fixed
- Replacing words with suggestions would remove adjacent spaces on Edge. #TINY-594
