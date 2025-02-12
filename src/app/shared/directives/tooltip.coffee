#I don't think we need this after upgrade to latest ui-bootstrap, revisit if needed
# angular.module('diligenceVault').directive 'uibTooltip', ($timeout) ->
#   restrict: 'A'
#   link: (scope, element, attrs) ->
#     if attrs.tooltipTrigger is 'show'
#       scope.$on 'modal.opened', ->
#         $timeout -> element.trigger('hide')
