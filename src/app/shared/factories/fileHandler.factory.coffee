angular.module('diligenceVault').factory 'FileHandlerFactory', ->

  new class FileHandlerFactory
    constructor: ->
      @file_handlers = {}
      @MAX_FILE_SIZE = '50MB'
      @MAX_FILENAME_CHARACTERS = 255
      @META_CHARACTER_REGEX = /^(?!^(PRN|AUX|CLOCK\$|NUL|CON|COM\d|LPT\d|\..*)(\..+)?$)[^\x00-\x1f\\?*:\";|/]+$/
      @FIRST_CHARACTER_REGEX = /^[^\=\+\-\@\s]/

    add: (name, file_handler) ->
      @file_handlers[name] = file_handler

    remove: (name) ->
      delete @file_handlers[name]

    get: (name) ->
      @file_handlers[name]

    getMaxFileSize: ->
      @MAX_FILE_SIZE

    getFilenameRegex: ->
      @META_CHARACTER_REGEX

    getFirstCharacterRegex: ->
      @FIRST_CHARACTER_REGEX

    getFilenameCharacterLimit: ->
      @MAX_FILENAME_CHARACTERS

    getFileTypes: ->
      list = ['pdf', 'doc', 'docx', 'jpg',
              'png', 'jpeg', 'xls', 'xlsm', 'xlsx',
              'odt', 'csv', 'vsd', 'vsdx',
              'pptx', 'ppt', 'pps', 'ppsx', 'key','msg','eml',
              'zip', 'rar', 'txt']

      list
