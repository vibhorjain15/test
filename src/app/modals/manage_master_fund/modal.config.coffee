angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_master_fund',
    controller: 'ManageMasterFundController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
      strategy: ->
      strategies: ->
      entity_id: ->
      source: ->
      fund_name: ->
