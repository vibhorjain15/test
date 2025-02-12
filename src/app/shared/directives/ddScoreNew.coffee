angular.module('diligenceVault').directive 'ddScoreNew', ->
  restrict: 'E'
  template: """
    <div class="dd-score-display from-dir cursor-default"
         uib-tooltip='{{score_tooltip}}'
         data-ng-class="score_class">
        <span>{{score ? score : 'N/A'}}<small data-ng-if='show_total'>/{{total}}</small></span>
    </div>
    """
  replace: true
  link: (scope, element, attrs) ->
    init = (score, total, show_total) ->
      if score == 0 || score == null || score == undefined
        score_class = 'na-score'
        score_tooltip = 'Score not assigned'
      else if (score/total) < 0.5
        score_class = 'bad-score'
        score_tooltip = 'Poor score'
      else if (0.5 <= (score/total)) && ((score/total) < 0.75)
        score_class = 'ok-score'
        score_tooltip = 'Average score'
      else if (score/total) >= 0.75
        score_class = 'good-score'
        score_tooltip = 'Good score'

      scope.score = score
      scope.score_class = score_class
      scope.score_tooltip = score_tooltip
      scope.total = total
      scope.show_total = (total && show_total)

    deregisterer = scope.$watchGroup [attrs.score, attrs.total, attrs.showTotal, attrs.keepWatcherOn], (values) ->
      [score, total, show_total, keep_watcher_on] = values
      if !(total == undefined || total == null)
        init(score, total, show_total)
        if !keep_watcher_on
          deregisterer()
