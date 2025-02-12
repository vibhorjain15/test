angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_dd_rule',
    controller: 'ManageDDRuleController'
    size: 'lg'
