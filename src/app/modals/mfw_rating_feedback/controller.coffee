class MFWRatingFeedbackController extends ModalController

  @register 'MFWRatingFeedbackController'

  @inject '$scope', '$http', 'toaster', '$timeout', 'baseUrl', 'Restangular'

  initialize: ->
    @Restangular.all('feedback_types').getList(show_only_fund_research: true).then (response) =>
      if response[0]?
        response[0].checked = true

      @feedback_request_types = response

      @initOptions()

    @feedVals = {}

    @$scope.$watch 'vm.feedVals.FTypeID', (newValue, oldValue) =>
      if newValue isnt oldValue
        @set_textarea_focus = true

  initOptions: ->
    @feedVals = FTypeID: @feedback_request_types[0]?.id

  processRequest: ->
    if @feedback_form.$valid
      @loading = true

      @$http.post(@baseUrl + '/feedback', JSON.stringify(@feedVals))
      .then ((response) =>
        message = 'Thank you for your feedback!'
        @toaster.pop 'success', '', message, 5000
        @initOptions()
        @feedback_form.$setPristine()
        @close()
        @loading = false
      ), (error) ->
        @loading = false
