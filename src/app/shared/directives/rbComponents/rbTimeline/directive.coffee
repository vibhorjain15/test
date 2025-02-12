angular.module('diligenceVault').directive 'rbTimeline', ($compile, FundDataservice, $q) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->

    getRandomTimelineValues = ->
      response =
        states: [
          {
            label: 'Start'
            value: 'start'
            desc: 'By John Smith'
            desc_type: 'text'
          },
          {
            label: 'Review'
            value: 'review'
            desc: 'By Michelle Lim'
            desc_type: 'text'
          },
          {
            label: 'Submit'
            value: 'submit'
            desc_type: 'text'
            desc: 'By John Smith'
          },
          {
            label: 'Complete'
            value: 'complete'
            desc_type: 'text'
            desc: 'By Patrick Novel'
          }
        ]
        current_state: 'complete'

      deferred = $q.defer()
      deferred.resolve(response)
      deferred.promise

    getTimelineData = (entity_id) ->
      return getRandomTimelineValues()
      ###return getRandomTimelineValues() unless entity_id?

      FundDataservice.getTimelineValues(fund_id)###

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    scope.$render = ->
      options = scope.component.options

      template = """
        <h4 class="clear-margin-top">#{options.title}</h4>
        <status-tracker states="timeline_config.states" ng-model="timeline_config.current_state"></status-tracker>
      """

      displaySpinner()

      getTimelineData(options.entity_id).then (response) ->
        scope.timeline_config = response

        element.html $compile(template)(scope)


    scope.$render()
