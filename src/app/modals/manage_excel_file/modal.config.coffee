angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_excel_file',
    controller: 'ManageExcelFileController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      params: ->
