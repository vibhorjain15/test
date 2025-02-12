angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.employees',
    url: '/employees'
    templateUrl: 'firm/settings/employees/template.html'
    controller: 'FirmSettingsEmployeesController'
    controllerAs: 'vm'
