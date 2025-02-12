angular.module('diligenceVault').directive 'fullCalendar', ->
  restrict: 'A'
  templateUrl: 'shared/directives/fullCalendar/template.html'
  link: (scope, element, attrs) ->
    $container = element.find('.js-fullcalendar-container')

    options =
      params:
        header:
          left: 'prev,next'
          center: 'title'
          right: 'month,agendaWeek,agendaDay'
        defaultDate: moment().format('YYYY-MM-DD')
        timezone: 'local'
        firstDay: 1
        editable: true
        eventLimit: true
        timeFormat: 'ha'
        displayEventEnd : true
        eventRender: (eventObj, element) ->
          element.popover
            content: moment(eventObj.start).format('ha') + " " + eventObj.title
            trigger: 'hover click'
            placement: 'top'
            container: 'body'
        eventClick: (eventObj, jsObject, view) ->
          $(this).popover('hide')

    deregisterer = scope.$watch attrs.calendarEvents, (events) ->
      if events
        scope.has_events = !!events.length
        options.params.events = events
        $container.fullCalendar options.params
        deregisterer()

    scope.gotoPreviousMonth = -> $container.fullCalendar('prev')
    scope.gotoNextMonth = -> $container.fullCalendar('next')
