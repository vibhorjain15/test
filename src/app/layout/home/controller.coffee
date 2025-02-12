class HomeController extends BaseController

  @register 'HomeController'

  @inject '$state', 'Utils'

  initialize: ->
    @is_freeSubscription = @Utils.isFreeSubscription()
    @is_manager = @Utils.isManager()
    @isDefault = @Utils.isDefaultHomePage()
    if !@Utils.isSecurityAdmin() && !@isDefault
      @$state.go 'app.dash', dashType: 'my-work'
    else if @$state.params.from_office_extension
      if @Utils.isFormADVSubscription() || @Utils.isFormADVAnalyticsSubscription()
        @$state.go 'app.form_adv.regulatory_monitor.portfolio', @$state.params
      else if @Utils.isManager() && (not @is_freeSubscription)
        @$state.go 'app.monitor.investments', @$state.params
      else if @Utils.isInvestor() && @is_freeSubscription
        @$state.go 'app.form_adv.regulatory_monitor.portfolio', @$state.params
      else
        params = @$state.params
        params.type = 'in-progress'
        @$state.go 'app.diligence.projects.activity', params
    else if @$state.params.redirectId and @is_manager and !@Utils.isSecurityAdmin()
      @$state.go 'app.inbound.review_request', {redirectId: @$state.params.redirectId}
    else
      if @Utils.isSecurityAdmin()
        @$state.go 'app.firm.settings.employees'
      else if @Utils.isFormADVSubscription() || @Utils.isFormADVAnalyticsSubscription()
        @$state.go 'app.form_adv.regulatory_monitor.portfolio'
      else if @Utils.isManager() && (not @is_freeSubscription)
        @$state.go 'app.monitor.investments'
      else if @Utils.isInvestor() && @is_freeSubscription
        @$state.go 'app.form_adv.regulatory_monitor.portfolio'
      else
        @$state.go 'app.diligence.projects.activity', type: 'in-progress'