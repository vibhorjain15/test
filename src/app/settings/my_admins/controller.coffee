class MyAdminsController extends BaseController
  @register 'MyAdminsController'

  @inject '$scope', '$window', 'MyAdminsResource', 'Utils', 'angularEnabled'

  initialize: ->
    @current_user = @Utils.getCurrentUser()
    @getMyAdmins()

  goBack: =>
    @$window.history.back()

  getMyAdmins: (type)=>
    @loading = true
    @myAdminsData = null
    @myAdminsData = @MyAdminsResource.$new()
    @loading = false
