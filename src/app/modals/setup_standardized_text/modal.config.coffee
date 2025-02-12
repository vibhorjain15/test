angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'setup_standardized_text',
    controller: 'SetUpStandardizedTextController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      question: ->
      templateId: ->
      subCategoryId: ->
