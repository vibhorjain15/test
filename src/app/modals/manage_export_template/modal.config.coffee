angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_export_template',
    controller: 'ManageExportTemplateController'
    backdrop: 'static'
    keyboard: false