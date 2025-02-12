angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit_team',
    controller: 'EditTeamController'
    backdrop: 'static'
