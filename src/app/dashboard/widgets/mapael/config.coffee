angular.module('diligenceVault').config (DashboardFactoryProvider) ->
  DashboardFactoryProvider.registerWidget 'mapael',
    controller: 'MapaelWidgetController'
    controllerAs: 'vm'
    template: '<div mapael options="vm.options"></div>'
