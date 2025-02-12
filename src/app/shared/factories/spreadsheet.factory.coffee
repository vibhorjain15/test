angular.module('diligenceVault').factory 'SpreadSheetFactory', ->
  new class SpreadSheetFactory
    getWidgetTemplate: (fieldType) ->
      # code that returns appropriate field template
