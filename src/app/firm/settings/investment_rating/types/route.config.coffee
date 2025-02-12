angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.investment_rating.types',
    url: '/types?rating_id'
    templateUrl: 'firm/settings/investment_rating/types/template.html'
    controller: 'FirmSettingsInvestmentRatingTypesController'
    controllerAs: 'vm'
