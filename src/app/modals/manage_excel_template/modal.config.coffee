angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_excel_template',
    controller: 'ManageExcelTemplateController'
    backdrop: 'static'
    keyboard: false
    size: 'lg-wp'
    resolve:
      selection: ->
      params: ->
      source: ->
