angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit_excel_selection',
    controller: 'EditExcelSelectionController'
    backdrop: 'static'
    size: 'lg'
    resolve:
      selection: ->
      params: ->
