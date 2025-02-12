class DDActivityController extends BaseController

  @register 'DDActivityController'

  @inject 'Restangular', 'Utils'

  initialize: ->
    @is_investor = @Utils.isInvestor()

    @Restangular.all('dd_activities').getList().then (response) =>
      @dd_activities = response
