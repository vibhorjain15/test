###
dashboardProvider.registerDashboard 'platform_activity',
  title: 'Platform Activity'
  layout: 'layout-name'
  rows:
    {
      columns: [
        { widget: {type: 'donut-chart', title: 'Strategy Allocation', options: {}}, colSpan: 1}
        {widget: {type: 'world-map', title: 'Manager Focus', options: {}}, colSpan: 2}
      ]
    }
    {
      columns: [
        {widget: {}}
        {widget: {}}
        {widget: {}}
      ]
    }
    {
      columns: [
        {widget: {}}
        {widget: {}}
      ]
    }

dashboardProvider.registerWidget 'donut-chart',
  controller: ''
  controllerAs: ''
  template: '' # templateUrl

<dashboard name="platform_activity"></dashboard>

<!-- dashboard template -->
<div class="dashboard">
  <dashboard-row data-ng-repeat="row in model.rows"></dashboard-row>
</div>

  <!-- dashboard row -->
  <div class="row clearfix">
    <dashboard-widget data-ng-repeat="widget in row.widgets"></dashboard-widget>
  </div>

  <!-- dashboard widget -->
    <!-- $compiles widget & inserts inside the container -->
    <!-- advanced widgets which depend on XHR or would like to perform filters should register themselves on
         dashboardWidgetController, now while the data is being loaded, each widget can call
         dashboardWidgetController.displayLoader() to display a loader.

         Filtering would be turned on if it is provided under widget config as true, dashboardWidgetController throws
         error if the widget does not registers itself on dashboardWidgetController & filtering is turned on

         When the user selects some filters & applies them, the dashboardWidgetController will call
         widgetController.applyFilters(params), the widget internally will load the data, process & load/unload/rerender


    <!-- each widget if xhr dependent should require the dashboardWidgetController & can perform actions like
         displaying a loader etc -->
  <div class="panel dashboard-panel">

  </div>

<div donut-chart config="config"></div>

We need two things here, one is a dashboard, dashboard-editor

dashboard is what we see readonly version(what users see)
dashboard-editor let's you configure widgets/sorting them/widget configurables/persisting the configuration
###

class DashboardFactoryProvider
  widgetDefinitionMap = {}

  registerWidget: (type, config) ->
    defaults = {}

    unless config.templateUrl? or config.template?
      defaults.templateUrl = "dashboard/widgets/#{type}/template.html"

    widgetDefinitionMap[type] = _.extend({}, defaults, config)

  $get: ->
    getWidgetDefinition = (type) -> widgetDefinitionMap[type]

    {
      getWidgetDefinition: getWidgetDefinition
    }

angular
  .module('diligenceVault')
  .provider 'DashboardFactory', DashboardFactoryProvider
