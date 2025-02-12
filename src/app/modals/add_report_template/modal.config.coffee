angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_report_template',
    controller: 'AddReportTemplateController'
    backdrop: 'static'
    size: 'lg'
    resolve:
      report: ->
