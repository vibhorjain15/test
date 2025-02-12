angular.module('diligenceVault').factory 'FeatureRestangular', (Restangular) ->
  Restangular.withConfig (RestangularConfigurer) ->
    base_url = 'http://dv-feature.azurewebsites.net/api'

    RestangularConfigurer.setBaseUrl(base_url)
