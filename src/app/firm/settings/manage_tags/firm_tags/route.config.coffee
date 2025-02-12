angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.firm_tags',
    url: '/firm_tags'
    controller: 'FirmSettingsFirmTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/firm_tags/template.html'
    hidden_from: ['securityAdmin']