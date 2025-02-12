angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.modalState 'app.euc',
    url: '/euc?redirectToState&redirectToParams'
    data:
      modalConfig:
        name: 'euc'
