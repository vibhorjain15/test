angular.module('diligenceVault').directive 'formadvFilingComparison', ->
  restrict: 'E'
  scope: true
  templateUrl: 'form_adv/firm/filings_history/directives/formadvFilingComparison/template.html'
  controller: 'FormADVFilingComparisonController'
  controllerAs: 'vm'
  link: ($scope, element, attrs) ->
    $scope.setColumnLength = (cols) ->
      $(element).addClass( "table-col-"+cols )