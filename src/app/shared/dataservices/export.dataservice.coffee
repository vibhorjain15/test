angular.module('diligenceVault').factory 'ExportDataservice', (Restangular)->
  new class ExportDataservice
    getTemplates: ->
      Restangular.all('templates').getList(in_use: true)
    
    createReport: (params) ->
      Restangular.all('diligences/generate_excel_report').customGET('', params)
