###*
 * @ngdoc directive
 * @name attachmentIcon
 * @restrict E
 *
 * @param {expression} filename Angular expression which returns file name
 * @param {string=} size size of the file extension icon,
 * possible options `lg`, `2x`, `3x`, `fw`(Based on font awesome icon size classes, applies `fa-lg`, etc)
 *
 * @description
 * Renders appropriate icon for a given filename based on it's file extension
 * Supported file extensions `doc`, `docx`, `csv`, `xls`, `xlsm`, `xlsx`, `pdf`, `png`, `jpg`,
 * `jpeg`, `gif`, `mp4`, `mov`, `avi`, `ppt`, `pptx`, `pptm`, `pps`,
 * `ppsx`, `vsd`, `vsdx`,`msg`,`eml`
 ###
angular.module('diligenceVault').directive 'attachmentIcon', ($compile) ->
  restrict: 'E'
  link: (scope, element, attrs) ->
    render = (filename) ->
      splits = filename.split('.')
      file_extension = splits[splits.length - 1]
      icon_map =
        doc: 'file-doc'
        rtf: 'file-doc'
        docx: 'file-docx'
        csv: 'file-excel'
        xls: 'file-excel'
        xlsm: 'file-excel' 
        xlsx: 'file-excel'
        pdf: 'file-pdf-o'
        png: 'picture'
        jpg: 'picture'
        jpeg: 'picture'
        gif: 'picture'
        mp4: 'movie'
        mov: 'movie'
        avi: 'movie'
        ppt: 'powerpoint'
        pptx: 'powerpoint'
        pptm: 'powerpoint'
        pps: 'powerpoint'
        ppsx: 'powerpoint'
        vsd: 'visio'
        vsdx: 'visio'
        txt: 'file'
        log: 'file'
        sql: 'file'
        htm: 'file'
        msg: 'mail'
        eml: 'mail'

      icon_name = icon_map[file_extension.toLowerCase()]

      if !icon_name
        icon_name = 'document-question'

      element.html $compile("<icon name=\"#{icon_name}\" size=\"#{attrs.size}\" colored></icon>")(scope)

    scope.$watch attrs.filename, (value) ->
      render(value) if value?
