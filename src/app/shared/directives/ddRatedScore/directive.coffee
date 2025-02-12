angular.module('diligenceVault').directive 'ddRatedScore', (Utils, ratingConstants)->
  restrict: 'E'
  templateUrl: 'shared/directives/ddRatedScore/template.html'
  replace: true
  link: (scope, element, attrs) ->
    init = (score, total, show_total, ratingScale, naValue, ratingValue, useRatingValue) ->
        if score == null || score == undefined || (useRatingValue && ratingValue == ratingConstants.naValue)
            score_class = naValue.color_code
            font_color = Utils.pickTextColorBasedOnBgColorAdvanced(naValue.color_code)
            score_tooltip = 'Score not assigned'
        else if useRatingValue
          if ratingScale.length == 1
            maxScore = 5
          else
            maxScore = ratingScale.length
          scaleArray = [1..maxScore]
          colorScheme = _(ratingScale).pluck ('color_code')
          colorScale = d3.scale.linear().domain(scaleArray).range(colorScheme)

          scale = Utils.getColorCodeFromDomain(ratingValue,colorScale)
          scaleValue = _(ratingScale).findWhere(value: Math.ceil(ratingValue))
          if scaleValue and scale
            score_class =  scale['background-color']
            font_color = scale.color
            score_tooltip = scaleValue.name
        else
            _(ratingScale).each (scale)=>
                if score >= scale.range_min_value and score <= scale.range_max_value
                    score_class =  scale.color_code
                    font_color = Utils.pickTextColorBasedOnBgColorAdvanced(scale.color_code)
                    score_tooltip = scale.name

        scope.score = score
        scope.score_class = score_class
        scope.font_color = font_color
        scope.score_tooltip = score_tooltip
        scope.total = total
        scope.show_total = (total && show_total)

    deregisterer = scope.$watchGroup [attrs.score, attrs.total, attrs.showTotal, attrs.keepWatcherOn, attrs.ratingScale, attrs.naValue, attrs.ratingValue, attrs.useRatingValue], (values) ->
      [score, total, show_total, keep_watcher_on, ratingScale, naValue, ratingValue, useRatingValue] = values
      if !(total == undefined || total == null) && ratingScale && naValue
        init(score, total, show_total, ratingScale, naValue, ratingValue, useRatingValue)
        if !keep_watcher_on
          deregisterer()
