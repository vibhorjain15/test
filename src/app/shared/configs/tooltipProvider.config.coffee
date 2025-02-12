angular.module('diligenceVault').config ($uibTooltipProvider) ->
  $uibTooltipProvider.options appendToBody: true

  $uibTooltipProvider.setTriggers
    'show': 'hide'
