angular.module('diligenceVault').directive 'dvRatingPreview', ($compile) ->
  restrict: 'E'
  link: (scope, element, attrs) ->
    scope.$watch attrs.ratingScales, (rating_scales) ->
      element.empty()

      if rating_scales?.length
        scope.ratingModel = null

        element.html $compile("""
            <dv-rating max="#{rating_scales.length}" data-ng-model="ratingModel" rating-scales="#{attrs.ratingScales}"></dv-rating>
          """)(scope)
    , true

