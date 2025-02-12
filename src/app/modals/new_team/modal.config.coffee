angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'new_team',
    controller: 'AddTeamController'
    backdrop: 'static'
    size: 'lg'
