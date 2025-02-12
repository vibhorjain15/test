###
Sometimes if the ui-grid(dv-grid) is a child of a element which has data-ng-show/data-ng-hide
the grid will be rendered blank because the container width will be available as 0 during the hide/show
switch, this directive triggers a refresh.

Usage:
  if you have data-ng-show="someCondition" add on the same element trigger-grid-refresh="someCondition"
  else if data-ng-hide="someCondition" add on the same element trigger-grid-refresh="!someCondition" (negate)
###
angular.module('diligenceVault').directive 'triggerGridRefresh', ($timeout)->
  restrict: 'A'
  link: (scope, element, attrs) ->
    deregisterer = scope.$watch attrs.triggerGridRefresh, (value) ->
      if value
        $timeout ->
          # this is the simplest solution, if ever you feel this is inefficient
          # try http://ui-grid.info/docs/#/tutorial/110_grid_in_modal, basically you can have name attribute
          # on dv-grid & save gridApi in a service, use the same service to fetch the gridApi instance & then
          # do gridApi.core.handleWindowResize()
          $(window).trigger('resize')
        , 10
        deregisterer()
