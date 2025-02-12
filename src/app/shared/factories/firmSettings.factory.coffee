angular.module('diligenceVault').factory 'firmSettingsService', (Restangular) ->

  class firmSettings

    constructor: (params) ->
      @colorsMap = [{"value":"#993300","label":"Burnt orange"},{"value":"#333300","label":"Dark olive"} ,{"value":"#000080","label":"Navy Blue"}, {"value":"#003300","label":"Dark green"},{"value":"#000000","label":"Black"},{"value":"#003366","label":"Dark azure"},{"value":"#333399","label":"Indigo"},{"value":"#333333","label":"Very dark gray"},{"value":"#800000","label":"Maroon"},{"value":"#FF6600","label":"Orange"},{"value":"#808000","label":"Olive"},{"value":"#008000","label":"Green"},{"value":"#008080","label":"Teal"},{"value":"#0000FF","label":"Blue"},{"value":"#666699","label":"Grayish blue"},{"value":"#808080","label":"Gray"},{"value":"#FF0000","label":"Red"},{"value":"#FF9900","label":"Amber"},{"value":"#99CC00","label":"Yellow green"},{"value":"#339966","label":"Sea green"},{"value":"#33CCCC","label":"Turquoise"},{"value":"#3366FF","label":"Royal blue"},{"value":"#800080","label":"Purple"},{"value":"#999999","label":"Medium gray"},{"value":"#FF00FF","label":"Magenta"},{"value":"#FFCC00","label":"Gold"},{"value":"#FFFF00","label":"Yellow"},{"value":"#00FF00","label":"Lime"},{"value":"#00FFFF","label":"Aqua"},{"value":"#00CCFF","label":"Sky blue"},{"value":"#993366","label":"Red violet"},{"value":"#FFFFFF","label":"White"},{"value":"#FF99CC","label":"Pink"},{"value":"#FFCC99","label":"Peach"},{"value":"#FFFF99","label":"Light yellow"},{"value":"#CCFFCC","label":"Pale green"},{"value":"#CCFFFF","label":"Pale cyan"},{"value":"#99CCFF","label":"Light sky blue"},{"value":"#CC99FF","label":"Plum"}]
      _(@colorsMap).forEach (color) =>
        color.label = color.value
      @colorScheme = params.colorScheme
      @updateColorMap()

    updateColorMap: () ->
      _(@colorScheme).forEach (color) =>
        @colorsMap.unshift({value: color, label: color})

    getColorsMap: ->
      return @colorsMap

  new class firmSettingsService
    $new: (options) ->
      new firmSettings(options)