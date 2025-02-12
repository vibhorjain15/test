angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.investment_rating.scales',
    url: '/scales'
    templateUrl: 'firm/settings/investment_rating/scales/template.html'
    controller: 'FirmSettingsInvestmentRatingScalesController'
    controllerAs: 'vm'
