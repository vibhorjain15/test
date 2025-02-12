class DiligenceTemplatePrintPreviewController extends BaseController

  @register 'DiligenceTemplatePrintPreviewController'

  @inject '$stateParams', 'Utils', '$scope', '$state','angularTemplateEnabled'

  initialize: ->
    @$scope.getTemplate().then (template) =>
      @template = template

  redirectToSections: ->
    @$state.go 'app.diligence.template.categories', add: true
