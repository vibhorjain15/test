###*
 * @ngdoc directive
 * @name dvDaterangepicker
 * @restrict E
 *
 * @param {expression} ngModel Assignable Angular expression to data-bind to.
 * @param {string=} id HTML id attribute
 * @param {expression=} minDate Defines the minimum available date. Requires a Javascript Date object.
 * @param {expression=} maxDate Defines the maximum available date. Requires a Javascript Date object.
 * @param {expression=} dateDisabled An optional expression to disable visible options based on passing an object with date and current mode properties.
 * @param {expression=} ngRequired Angular's `ng-required`
 * @param {expression=} ngChange Angular's `ng-change`
 * @param {expression=} datepickerMode (Default: day) - Current mode of the datepicker (day|month|year). Can be used to initialize the datepicker in a specific mode.
 * @param {expression=} initDate The initial date view when no model value is specified.
 * @param {expression=} showWeeks=false Whether to display week numbers (Defaults to `false`)
 *
 * @description
 * We use [angular ui datepicker](http://angular-ui.github.io/bootstrap/versioned-docs/1.3.3/#/datepicker).
 * To get the look that we want, the `<input>` needs to be wrapped inside `<div class="input-group"`
 * and have a button, which needs to have a `ng-click` event defined, so we've to define
 * the event handler on the corresponding `$scope`. Now, if we have say 10 datepickers in the app
 * we've to do it 10 times across the app.
 *
 * This directive aims at making the life simpler by wrapping `uib-datepicker-popup`, so that
 * you don't have to worry about click handlers, app level datepicker defaults etc & focus more on the functionality
###
angular.module('diligenceVault').directive 'dvDaterangepicker', (Utils,$timeout) ->
  restrict: 'E'
  scope: true
  template: (element, attrs) ->
    
    id = attrs.id
    minDate = attrs.minDate
    maxDate = attrs.maxDate
    dateDisabled = attrs.dateDisabled
    ngRequired = attrs.ngRequired
    ngChange = attrs.ngChange

    """
      <div class="range-picker">
        <input date-range-picker class="form-control date-picker" type="text"
              ng-model="#{attrs.ngModel}"
              picker="datePicker.picker"
              picker-classes="extra-class-names"
              min="#{minDate}"
              max="#{maxDate}"
              options="options"
              readonly
              />
        <icon name="calendar"></icon>
      </div>
    """

  link: (scope, element, attrs)=>
    if angular.isDefined attrs.applyMethod
      applyMethod = scope.$parent.$eval attrs.applyMethod

    scope.$parent.$watch attrs.ngModel, (newValue, oldValue) ->
      #When they change the value of date range picker in the controller, we need to update the displayed value accordingly
      if newValue.selectedRange == "No Filter"
        $timeout =>
          element.find('.date-picker').val('No Filter')
        , 100

    scope.options= {
      pickerClasses: 'custom-display' #angular-daterangepicker extra
      buttonClasses: 'btn'
      applyButtonClasses: 'btn-primary'
      cancelButtonClasses: 'btn-danger'
      locale: {
          applyLabel: "Apply"
          cancelLabel: 'Cancel'
          customRangeLabel: 'Custom range'
          separator: ' - '
          format: "YYYY-MM-DD"
      }
      opens: 'left'
      ranges: Utils.getDateRangeMap()
      eventHandlers: {
          'apply.daterangepicker': (event)=>
              picker = element.find('.date-picker').data('daterangepicker')
              dateRange = event.model
              dateRange.selectedRange = picker.chosenLabel
              customDateRange = scope.$parent.$eval(attrs.ngModel)
              customDateRange = dateRange
              if picker.chosenLabel == "No Filter"
                picker.setStartDate(moment())
                picker.setEndDate(moment())
                #We also need to do this here because the watcher gets executed before this event handler
                $timeout =>
                  element.find('.date-picker').val('No Filter')
                , 100
                applyMethod(null,null) if applyMethod
              else
                applyMethod(Utils.formatDatetime(event.model.startDate),Utils.formatDatetime(event.model.endDate)) if applyMethod
      }
    }