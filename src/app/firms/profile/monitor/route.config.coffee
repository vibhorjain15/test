angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.profile.monitor',
    url: '/monitor'
    template: '<ng2-firms-monitor></ng2-firms-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }
