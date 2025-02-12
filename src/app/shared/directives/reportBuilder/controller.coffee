class ReportBuilderController extends BaseController
  @register 'ReportBuilderController'
  @inject 'RbComponentFactory', '$q', '$attrs', '$scope',
          'ReportTemplateDataservice'

  initialize: ->
    @readonly = angular.isDefined(@$attrs.readonly)
    @realtimereport = angular.isDefined(@$attrs.realtimereport)
    @pages_deferred = @$q.defer()
    @template_deferred = @$q.defer()

    deregisterer = @$scope.$watch @$attrs.type, (value) =>
      if value?
        @type = value
        deregisterer()

  isReadOnly: ->
    @readonly

  isRealtimeReport: ->
    @realtimereport

  setTemplate: (template) ->
    @template_deferred.resolve(template)

    @template = template

  updateTemplate: (params) ->
    id = @template.id

    if @realtimereport

      if params
        @ReportTemplateDataservice.updateReport(id, params).then (response) =>
          angular.extend(@template, response)
      else
        @template.save()

    else
      if params
        @ReportTemplateDataservice.updateTemplate(id, params).then (response) =>
          angular.extend(@template, response)
      else
        @template.save()

  setPages: (pages) ->
    @pages_deferred.resolve(pages)

    @pages = pages

  setOptions: (options) ->
    @options = options

  getOptions: ->
    @options

  getTemplate: ->
    @template_deferred.promise

  getPages: ->
    @pages_deferred.promise

  insertComponent: (component_type, idx) =>
    if @active_component_controller
      idx = if idx then idx else (@active_component_controller.$scope.$index + 1)
    @canvas.insertComponent(component_type, idx)

  registerCanvas: (canvas) ->
    @canvas = canvas

  registerReportBuilderHeader: (report_builder_header) ->
    @report_builder_header = report_builder_header

    @getTemplate().then (template) ->
      report_builder_header.setTemplate(template)

  deactivateIfActiveComponent: (component) ->
    if @active_component_controller?.getComponent() is component
      @component_options_controller.deactivateComponent()

  deactivateComponent: ->
    @active_component_controller.deactivate()

    @active_component_controller = null

  activateComponent: (component_controller) ->
    return if component_controller is @active_component_controller

    @active_component_controller?.deactivate()

    @active_component_controller = component_controller

    @active_component_controller.activate()

    component = @active_component_controller.getComponent()

    @renderComponentSpecificSettings(component)

  renderComponentSpecificSettings: (component) ->
    component_type = component.type
    template = @RbComponentFactory.getComponentSettingsTemplate(component_type)

    @component_options_controller
      .renderComponentOptions(template, component)

  registerComponentOptionsController: (component_options_controller) ->
    @component_options_controller = component_options_controller
