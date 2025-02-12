class FirmSettingsPasswordController extends BaseController
  @register 'FirmSettingsPasswordController'

  @inject 'toaster', 'Restangular', 'Utils', 'BaseDataService','keywordConstants', '$timeout', 'ModalFactory', '$q'

  initialize: ->
    @Restangular.all('firm_preferences').customGET().then (response)=>
      @passwordObj = response
      # @firm_preferences_copy = angular.copy(@firm_preferences)

    

  # makeItSticky: ->
  #   if $(document).height() > $(window).height()
  #     $('.sticky_savebar').affix({offset: {bottom: 30} })

  submit: ->
    if @password_form.$valid
      @saving = true
      @Restangular.all('firm_preferences').customPUT(@passwordObj)
      .then (response) =>
        @toaster.pop 'success', '', 'Firm password preferences successfully saved', 5000
        @saving = false
      , (error) =>
        @saving = false
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          delete error.config.data.introduction
          delete error.config.data.generic_email
          delete error.config.data.sender_email
          delete error.config.data.cc_email
          delete error.config.data.bcc_email
          @Utils.logError('Updating Firm Preferences failed', error)

