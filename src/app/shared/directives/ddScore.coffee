angular.module('diligenceVault').directive 'ddScore', ->
  restrict: 'E'
  template: '<div class="dd-score-display from-dir"></div>'
  replace: true
  link: (scope, element, attrs) ->
    init = (score) ->
      unless score?
        score_class = 'na-score'
      else if score < 10
        score_class = 'bad-score'
      else if (10 <= score) && (score < 50)
        score_class = 'ok-score'
      else if score >= 50
        score_class = 'good-score'

      element.addClass(score_class)

      if score?
        ### This is what we're trying to append
          <strong>23<strong>
          <span>%<span>
        ###
        $score_html = $('<strong></strong>').text(score)
        element.append($score_html)
        element.append('<span> % </span>')
      else
        element.append('N/A')

    deregisterer = scope.$watchGroup [attrs.score], (values) ->
      [score] = values

      if score? #score can be null, hence not doing score?
        init(score)
        deregisterer()
