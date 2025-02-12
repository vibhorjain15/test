angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.product_tags',
    url: '/product_tags'
    controller: 'FirmSettingsProductTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/product_tags/template.html'
    hidden_from: ['securityAdmin']