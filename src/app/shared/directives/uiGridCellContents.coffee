angular.module('diligenceVault').directive 'uiGridCellContents', ->
  restrict: 'E'
  transclude: true
  replace: true
  template: '<div class="ui-grid-cell-contents"><ng-transclude /></div>'
