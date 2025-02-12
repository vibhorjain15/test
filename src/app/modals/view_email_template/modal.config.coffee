angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_email_template',
    controller: 'ViewEmailTemplateController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      id: ->
