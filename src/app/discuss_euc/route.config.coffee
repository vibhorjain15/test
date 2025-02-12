angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.modalState 'app.discuss_euc',
    url: '/discuss_euc'
    data:
      modalConfig:
        name: 'discuss_euc'
