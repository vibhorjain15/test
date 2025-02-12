angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_report_project',
    controller: 'AddReportProjectController'
    backdrop: 'static'
