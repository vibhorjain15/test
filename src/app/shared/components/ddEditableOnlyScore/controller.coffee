class ddEditableOnlyScoreController extends BaseController
    @register 'ddEditableOnlyScoreController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils'

    initialize: ->
        @maxScore = 100
        @score_invalid = false
        @$scope.$watchGroup ['vm.ratingScale', 'vm.naValue'], (values)=>
            if values[0] and values[1]
                @init(@score, @total, @show_total, @ratingScale, @naValue)

    init: (score, total, show_total, ratingScale, naValue) ->
        if score == null || score == undefined
            score = 0
            score_class = naValue.color_code
            font_color = @Utils.pickTextColorBasedOnBgColorAdvanced(naValue.color_code)
            score_tooltip = 'Score not assigned'
        else
            _(ratingScale).each (scale)=>
                if score >= scale.range_min_value and score <= scale.range_max_value
                    score_class =  scale.color_code
                    font_color = @Utils.pickTextColorBasedOnBgColorAdvanced(scale.color_code)
                    score_tooltip = scale.name

        @score_class = score_class
        @font_color = font_color
        @score_tooltip = score_tooltip
        @show_total = (total && show_total)

    allowEdit: =>
        @editAllowed = true

    onScoreChanged: (rating)=>
        if @score <= @maxScore
            @score_invalid = false
            @init(@score, @total, @show_total, @ratingScale, @naValue)
            @editAllowed = false
        else
            @score_invalid = true