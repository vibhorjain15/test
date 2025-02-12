class ProjectRecommendationController extends BaseController

  @register 'ProjectRecommendationsController'

  @inject 'BaseDataService', '$stateParams', '$scope', '$state', 'DueDiligenceDataservice', 'toaster'

  initialize: ->
  