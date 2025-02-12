angular.module('diligenceVault').directive 'dashboardPanel', (DashboardFactory, $q, $injector, $controller, $log, $compile, $templateCache, $http, LayoutUtils) ->
  getTemplate = (widgetDefinition) -> # This code is inspired from angular-dashboard-framework's widget-content.js
    deferred = $q.defer()
    template = widgetDefinition.template
    templateUrl = widgetDefinition.templateUrl

    if template
      deferred.resolve template
    else if templateUrl
      tpl = $templateCache.get templateUrl

      if tpl
        deferred.resolve tpl
      else
        $http
          .get(templateUrl)
          .then ((response) ->
            $templateCache.put(templateUrl, response)
            deferred.resolve response
          ), (->
            deferred.reject("Could not load template at #{templateUrl}")
          )

    deferred.promise


  renderWidget = (scope, element, widgetDefinition, widgetConfig) -> # This code is inspired from angular-dashboard-framework's widget-content.js
    $widgetContainer = element.find('.js-widget-container')
    widgetScope = scope.$new()
    injections =
      $scope: widgetScope
      options: widgetConfig.options
    resolvers = {}

    resolvers.$tpl = getTemplate(widgetDefinition)

    if widgetDefinition.resolve?
      angular.forEach widgetDefinition.resolve, (promise, key) ->
        if angular.isString(promise)
          resolvers[key] = $injector.get(promise)
        else
          resolvers[key] = $injector.invoke(promise, promise, injections)

    $q.all(resolvers).then (locals) ->
      angular.extend locals, injections

      template = locals.$tpl

      if widgetDefinition.controller?
        templateCtrl = $controller(widgetDefinition.controller, locals)

        if widgetDefinition.controllerAs
          widgetScope[widgetDefinition.controllerAs] = templateCtrl

        $widgetContainer.data('$ngControllerController', templateCtrl)

      $widgetContainer.html $compile(template)(widgetScope)
    , (reason) ->
      msg = 'Could not resolve all promises'

      msg += ": #{reason}" if reason?

      $log.error msg

  {
    restrict: 'E',
    replace: true,
    templateUrl: 'dashboard/directives/dashboardPanel/template.html'
    scope: true,
    link: (scope, element, attrs) ->
      config = null
      widgetDefinition = null

      init = ->
        widgetDefinition = DashboardFactory.getWidgetDefinition(config.type)

        unless widgetDefinition?
          $log.error "Widget #{widgetDefinition.type} is not defined!"
          return

        scope.widgetTitle = config.title

        renderWidget(scope, element, widgetDefinition, config)

      scope.enterFullscreenMode = ->
        LayoutUtils.enterFullscreenMode(element)
        scope.$broadcast('fullscreen:on')
        scope.fullscreen_mode = true

      scope.exitFullscreenMode = ->
        LayoutUtils.exitFullscreenMode(element)
        scope.$broadcast('fullscreen:off')
        scope.fullscreen_mode = false

      deregisterer = scope.$watch attrs.config, (value) ->
        if value?
          config = value
          init()
          deregisterer()
  }
