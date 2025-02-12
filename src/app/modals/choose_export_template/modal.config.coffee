angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'choose_export_template',
    controller: 'ChooseExportTemplateController'
    resolve:
      diligence: ->
