angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.ai-terms-of-use',
    url: '/ai-terms-of-use'
    template: '<ng2-ai-terms-of-use></ng2-ai-terms-of-use>'
