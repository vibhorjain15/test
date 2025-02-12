angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_email_template',
    controller: 'ManageEmailTemplateController'
    backdrop: 'static'
    size: 'lg'
    resolve:
      template: ->
