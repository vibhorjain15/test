class PremiumController extends BaseController
  @register 'PremiumController'

  @inject 'toaster','$http', 'baseUrl', 'Restangular'

  initialize: ->
    @loading = false
    @requestTypes = {
      "standardddq": "Standard DDQ Management Module",
      "esg": "ESG Data Collection Module",
      "rfp": "RFP Automation",
      "content": "Intelligent Content Management",
      "db": "Database Profile Management"
    }

  demosignup: (focus) ->
    @loading = true
    params = {FTypeID: 2004, FeedbackText: "I’d like to schedule a demo for #{focus}"}

    @$http.post(@baseUrl + '/feedback', JSON.stringify(params))
    .then ((response) =>
      @loading = false
      message = 'Thank you for your interest. Our team will connect with you shortly'

      @toaster.pop 'success', '', message, 5000

    ), (error) ->
      @loading = false
