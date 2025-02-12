angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_excel_sheets',
    controller: 'ManageExcelSheetsController'
    backdrop: 'static'
    keyboard: false
    resolve:
      sheets: ->
      disabledMode: ->
