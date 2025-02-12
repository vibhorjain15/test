###
https://github.com/garand/sticky
###
angular.module('diligenceVault').directive 'dvAffixScrollable', ($window, $timeout) ->
  restrict: 'EAC',
  link: (scope, iElement, iAttrs) ->
    $sidebar = iElement
    $window = $(window)
    $sidebar.css "transition", "all ease .3s"
    $timeout =>
      jQuery(iElement).sticky({topSpacing:50, bottomSpacing: 30})
