angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.funds.profile.monitor',
    url: '/monitor'
    template: '<ng2-products-monitor></ng2-products-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.funds.profile.monitor',
    url: '/monitor'
    template: '<ng2-products-monitor></ng2-products-monitor>'
    resolve: previousState: ($state) ->
      "ngInject"
      {
        name: $state.current.name
        params: $state.params
      }
