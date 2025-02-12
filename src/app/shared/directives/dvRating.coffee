angular.module('diligenceVault').directive 'dvRating', ->
  restrict: 'EA'
  require: 'ngModel'
  template: (element, attrs) ->
    """
      <span class="dv-rating" data-ng-class="{'readonly': readOnly}">
        <uib-rating data-ng-model='#{attrs.ngModel}'
                max='#{attrs.max}'
                read-only="#{attrs.readonly}"
                data-ng-change="#{attrs.ngChange}"
                on-hover="#{attrs.onHover || 'displayScalePreview(value)'}"
                on-leave="#{attrs.onLeave || 'hideScalePreview()'}"
                state-on="'{{state_on}}'"
                state-off="'{{state_off}}'"
                rating-states="ratingStates"></uib-rating>
        <span class="align-middle space-on-left" data-ng-show="scale_value || scale_preview_value">
          <b data-ng-hide="display_scale_preview">{{scale_value}}</b>
          <b data-ng-show="display_scale_preview">{{scale_preview_value}}</b>

          <a role="button"
             class="align-middle link-disguise link-unstyled"
             uib-tooltip="Clear Rating"
             data-ng-hide="readOnly || display_scale_preview"
             data-ng-click="resetRating()">
            <icon name="times"></icon>
          </a>
        </span>
      </span>
    """

  controller: ($scope, $attrs, $parse) ->
    ratingScales = $scope.$eval($attrs.ratingScales)

    setStateValues = =>
      $scope.state_on = 'dvi dvi-square rating-level fa-lg'
      $scope.state_off = 'dvi dvi-square rating-level fa-lg level-off'

    setStateValues()

    $scope.$watch $attrs.readonly, (value) ->
      $scope.readOnly = value
      setStateValues()

    setScaleColor = (value) ->
      if ratingScales
        $scope.ratingStates = []
        _(ratingScales).each ((scale,index)=>
          if scale.color_code
            count = index+1
            if $scope.sub_category
              styleName = 'rating_'+$scope.sub_category.id+'level-on-'+count
            else
              styleName = 'rating_level-on-'+count

            if $('html > head style#'+styleName).length > 0
              $('html > head style#'+styleName).remove()

            $("<style>").prop("type", "text/css").prop("id",styleName).html('.'+styleName+'{ color: '+scale.color_code+'; }').appendTo("head")

            $scope.ratingStates.push {
              stateOn: 'dvi dvi-square rating-level fa-lg '+styleName
              stateOff: 'dvi dvi-square rating-level fa-lg level-off'
            }
          else
            $scope.ratingStates.push {
              stateOn: 'dvi dvi-square rating-level fa-lg level-on'
              stateOff: 'dvi dvi-square rating-level fa-lg level-off'
            }
        )

    setScaleColor()

    getScaleValue = (value) ->
      return unless value

      if ratingScales?
        rating = _(ratingScales).findWhere({value: value})
        if rating
          rating.name
      else
        value

    $scope.$watch $attrs.ngModel, (value) ->
      $scope.scale_value = getScaleValue(value)

    $scope.displayScalePreview = (value) ->
      return if $scope.readOnly

      $scope.display_scale_preview = true
      $scope.scale_preview_value = getScaleValue(value)

    $scope.hideScalePreview = ->
      return if $scope.readOnly

      $scope.display_scale_preview = false
      $scope.scale_preview_value = null

    return



  link: (scope, element, attrs, ngModelController) ->
    scope.resetRating = ->
      ngModelController.$setViewValue(null)
