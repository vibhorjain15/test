class AnalyzeTemplateCategoriesController extends BaseController
  @register 'AnalyzeTemplateCategoriesController'
  @inject '$stateParams', 'Utils','TemplatesDataService', '$state','$scope','angularEnabled'

  initialize: ->
    @templateId = @$stateParams.templateId
    @tagId = @$stateParams.tagId
    @start_date = @$state.params.start_date
    @end_date = @$state.params.end_date
    @selectedRange = @$state.params.selectedRange

    @getParentSections().then (response) =>
      if (@$state.current.name is 'app.analyze.templates.categories' and
          response.length > 0)
        @$state.go 'app.analyze.templates.categories.responses', {
          categoryId: response[0].id,
          tagId : @tagId
          start_date : @start_date
          end_date : @end_date
          selectedRange : @selectedRange
        }

  getParentSections: ->
    @TemplatesDataService.getSections(@templateId, {
      isParent: true
    }).then (response) =>
      @parent_sections = response
      @$scope.parent_sections = @parent_sections
