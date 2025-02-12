angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_questions_custom_search',
    controller: 'ManageQuestionsCustomSearchController'
    size: 'xl'
    resolve:
      custom_filters_data: ->