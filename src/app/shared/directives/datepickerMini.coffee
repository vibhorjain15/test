###*
 * @ngdoc directive
 * @name datepickerMini
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
angular.module('diligenceVault').directive 'datepickerMini', ->
  restrict: 'E'
  scope: true
  template: (element, attrs) ->
    id = attrs.id
    minDate = attrs.minDate
    maxDate = attrs.maxDate
    dateDisabled = attrs.dateDisabled
    ngRequired = attrs.ngRequired
    ngChange = attrs.ngChange
    datepickerMode = attrs.datepickerMode
    initDate = attrs.initDate
    showButtonBar = attrs.showButtonBar or false
    showWeeks = attrs.showWeeks or false
    tooltipText = attrs.tooltipText

    """
      <div class="datepickerMini input-group datepicker-group" data-ng-if="datepickerOptions" uib-tooltip="#{tooltipText}">
        <input type="text"
               class="hide"
                uib-datepicker-popup="dd-MMMM-yyyy"
                data-ng-model="#{attrs.ngModel}"
                is-open="popup.open"
                #{(if id then "id='#{id}'" else '')}
                #{(if minDate then "min-date='#{minDate}'" else '')}
                #{(if maxDate then "max-date='#{maxDate}'" else '')}
                datepicker-options="datepickerOptions"
                data-ng-click="openDatePicker($event)"
                #{(if dateDisabled then "date-disabled='#{dateDisabled}'" else '')}
                #{(if ngRequired then "ng-required='#{ngRequired}'" else '')}
                #{(if ngChange then "ng-change='#{ngChange}'" else '')}
                #{(if datepickerMode then "datepicker-mode='#{datepickerMode}'" else '')}
                #{(if initDate then "init-date='#{initDate}'" else '')}
                readonly="readonly"
                show-button-bar="#{showButtonBar}"
                show-weeks="#{showWeeks}"/>
        <button btn-type="transparent" class="button-calendar"
                  tabindex="-1" data-ng-click="openDatePicker($event)">
          <icon name="calendar" class="calendar-icon"></icon>
        </button>
      </div>
    """
  link: (scope, element, attrs) ->
    scope.datepickerOptions =
      formatYear: 'yy'
      startingDay: 1,
      showWeeks: false
    scope.popup = open: false

    if attrs.minDate?
      scope.datepickerOptions.minDate = scope.$parent.$eval attrs.minDate

    if attrs.maxDate?
      scope.datepickerOptions.maxDate = scope.$parent.$eval attrs.maxDate

    scope.openDatePicker = ($event) ->
      $event.preventDefault()
      $event.stopPropagation()
      scope.popup.open = true
# <span class="input-group-btn">
        #   <button class="btn btn-default calendar-icon" data-ng-click="openDatePicker($event)" uib-tooltip="#{tooltipText}">
            
        #   </button>
        # </span>