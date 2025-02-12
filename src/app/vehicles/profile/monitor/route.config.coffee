angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.vehicles.profile.monitor',
    url: '/monitor'
    template: '<ng2-vehicles-monitor></ng2-vehicles-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.funds.vehicles.profile.monitor',
    url: '/monitor'
    template: '<ng2-vehicles-monitor></ng2-vehicles-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }
