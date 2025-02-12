angular.module('diligenceVault').directive 'bindHtmlCompile', ($compile) ->
    restrict: 'A',
    link: (scope, element, attrs)=>
        scope.$watch () =>
            return scope.$eval(attrs.bindHtmlCompile)
        ,(value) =>
            element.html(value)
            $compile(element.contents())(scope)