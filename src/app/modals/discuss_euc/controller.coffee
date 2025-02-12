class DiscussEUCController extends ModalController
  @register 'DiscussEUCController'
  @inject '$state', 'Restangular', 'Utils', '$window'

  initialize: ->
    @goToHome() if @Utils.discussAgreementAccepted()
    @template = @Utils.getLazyLoadableTemplateFor('discuss-euc')

  acceptAgreement: ->
    @loading = true
    @Restangular.all('users').all('certify').post({type: 'DiscussEucAccepted'}).then =>
      @loading = false
      @$window.location.reload()

  cancel: ->
    @goToHome()
    super

  goToHome: -> @$state.go('app.home')
