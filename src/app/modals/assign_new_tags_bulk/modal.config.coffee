angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'assign_new_tags_bulk',
    controller: 'AssignNewTagsBulkController'
    size: 'lg'
    resolve:
      questionsList: ->
