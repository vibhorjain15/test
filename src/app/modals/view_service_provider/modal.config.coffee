angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_service_provider',
    controller: 'ViewServiceProviderController'
    controllerAs: 'vm'
    size: 'lg'
