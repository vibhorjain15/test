angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit_offline_dd_question',
    controller: 'EditOfflineDDQuestionController'
