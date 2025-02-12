angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_template',
    controller: 'ManageTemplateController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      template: ->
      source: ->
      pendingrequest: ->
      templateOptions: ->
