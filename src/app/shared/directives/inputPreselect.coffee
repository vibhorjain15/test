angular.module('diligenceVault').directive 'inputPreselect', ($timeout) ->
  restrict: 'A'
  link: (scope, element) ->
    $timeout -> element.select() #Preselect the input the moment it gets injected in the DOM
