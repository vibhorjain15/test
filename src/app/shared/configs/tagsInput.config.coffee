angular.module('diligenceVault').config (tagsInputConfigProvider) ->
  tagsInputConfigProvider.setActiveInterpolation('tagsInput', placeholder: true).setDefaults 'autoComplete',
    debounceDelay: 200
    minResultsToShow: 5
    loadOnDownArrow: true
