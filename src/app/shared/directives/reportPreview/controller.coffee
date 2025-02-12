class ReportPreviewController extends BaseController
  @register 'ReportPreviewController'
  @inject '$scope', '$attrs', '$element', '$compile', '$q'

  initialize: ->
    @watchForTemplate()
    @watchForOptions()

  watchForTemplate: ->
    @$scope.$parent.$watch @$attrs.template, (template) =>
      if template?
        @template = template

        @render()

  watchForOptions: ->
    @$scope.$parent.$watch @$attrs.options, (options) =>
      if options?
        @options = options

        @render()

  getTemplate: ->
    """
      <report-builder data-ng-model="vm.template"
                      options="vm.options"
                      readonly>
      </report-builder>
    """

  render: ->
    if @template? and @options?
      template = @getTemplate(@template, @options)

      @$element.html(@$compile(template)(@$scope))
