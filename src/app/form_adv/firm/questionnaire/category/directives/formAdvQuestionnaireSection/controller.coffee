class FormADVQuestionnaireSectionController extends BaseController
  @register 'FormADVQuestionnaireSectionController'

  @inject '$attrs', '$scope'

  initialize: ->
    @section = @$scope.$parent.$eval(@$attrs.section)
