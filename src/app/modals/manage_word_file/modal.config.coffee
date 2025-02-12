angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_word_file',
    controller: 'ManageWordFileController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      params: ->
      source: ->
