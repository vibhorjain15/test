angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.strategies.profile.monitor',
    url: '/monitor'
    template: '<ng2-strategies-monitor></ng2-strategies-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.strategies.profile.monitor',
    url: '/monitor'
    template: '<ng2-strategies-monitor></ng2-strategies-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }
