angular.module('diligenceVault').directive 'dvShowMore', ($interval, $timeout) ->
  restrict: 'A'
  templateUrl: 'shared/directives/dvShowMore/template.html'
  transclude: true
  link: (scope, element, attrs) ->
    scope.showMoreHeight = attrs.showMoreHeight || 150
    scope.expanded = attrs.expanded || false;
    scope.inputIsImg = false
    scope.multiLineText = false
    $timeout =>
      scope.inputString = element[0].innerText
      imgTag = $( element[0]).find( "img" )[0]
      if imgTag and $(imgTag).is("img")
        scope.inputIsImg = true
      if scope.inputString.split("\n").length > 1
         scope.multiLineText = true
    scope.expandable = false;
    renderStyles = =>
      #We check for the ceil of element.height because in some browsers element height varies based on their zoom level
      if (Math.ceil(element.height()) >= scope.showMoreHeight && scope.expanded == false)
        scope.expandable = true

    $interval (->
      renderStyles()
      return
    ), 300

    scope.showLessStyle = {
      'max-height': scope.showMoreHeight + 'px',
      'overflow': 'hidden'
    };
