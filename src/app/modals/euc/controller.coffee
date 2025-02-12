class EUCController extends ModalController
  @register 'EUCController'
  @inject 'Utils', 'Restangular', '$window', 'AuthService'

  initialize: ->
    @template = @Utils.getLazyLoadableTemplateFor('euc')
    @acceptedAgreement = false;

  acceptAgreement: ->
    if @templateLoaded && @acceptedAgreement
      @loading = true
      @Restangular.all('users').all('certify').post({type: 'EucAccepted'}).then =>
        @loading = false
        @$window.location.reload()

  close: (response) ->
    @AuthService.logoutViaRequest().then =>
      super(response)
