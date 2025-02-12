angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'group_by_help',
    controller: 'GroupByHelpController'
    backdrop: 'static'
    size: 'lg'
