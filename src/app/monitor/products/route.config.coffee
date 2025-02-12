angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.products',
    url: '/products'
    controller: 'MonitorProductsController'
    controllerAs: 'vm'
    templateUrl: 'monitor/products/template.html'
    accessible_to: [ 'manager' ]
