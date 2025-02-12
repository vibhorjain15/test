angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.discover.structure',
    url: '/:structure'
    controller: 'DiscoverController'
    controllerAs: 'vm'

    templateUrl: ($stateParams) ->
      structure = $stateParams.structure

      "discover/structure/#{structure}.html"
