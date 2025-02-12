class ProjectQuestionnaireCategoryController extends BaseController
  @register 'ProjectQuestionnaireCategoryController'

  @inject '$stateParams', '$scope','Utils','Restangular','angularQuestionnaireEnabled'

  initialize: ->
    @categoryId = @$stateParams.categoryId
    @is_investor = @Utils.isInvestor()
    @is_freeSubscription = @Utils.isFreeSubscription()

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
