class AccountActivityController extends BaseController
  @register 'AccountActivityController'

  @inject 'Restangular', 'Utils','angularEnabled'

  initialize: ->
    @Restangular.all('sessions').getList().then (response) =>
      @sessions = response
