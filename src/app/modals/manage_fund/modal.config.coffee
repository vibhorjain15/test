angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_fund',
    controller: 'ManageFundController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
      fund: ->
      strategies: ->
      parent_strategy: ->
      entity_id: ->
      source: ->
      fund_name: ->
