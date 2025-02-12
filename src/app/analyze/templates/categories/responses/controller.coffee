class AnalyzeTemplateCategoryResponsesController extends BaseController
  @register 'AnalyzeTemplateCategoryResponsesController'
  @inject '$stateParams'

  initialize: ->
    @templateId = @$stateParams.templateId
    @tagId = @$stateParams.tagId