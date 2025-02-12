class AddIPConfigController extends ModalController
  @register 'AddIPConfigController'

  @inject '$state', 'toaster', 'Utils', 'Restangular', '$scope', 'ip_configurations_length', 'current_ip', 'BaseDataService'

  initialize: ->
    @current_user = @Utils.getCurrentUser()

    currentDate = new Date()
    @name = 'IP ' + (currentDate.getMonth() + 1) + "-" + currentDate.getDate() + "-" + currentDate.getFullYear()

    @$scope.$watchGroup ['vm.start_ip', 'vm.end_ip'], (values) =>
      if values[0] && values[1]
        @rangeOfIPs = @Utils.getRangeOfIP(values[0], values[1])

  addCurrentIP: () =>
    @start_ip = @current_ip
    @is_single_ip = true

  toggleIPAdditionMode: () =>
    @is_single_ip = !@is_single_ip
  
  submit: =>
    if @add_ip_form.$valid
      @loading = true

      params =
        'name': @name
        'start_ip': @start_ip
        'end_ip' : @end_ip

      if @is_single_ip
        params.end_ip = params.start_ip

      @Restangular.all('ip_configurations').post(params)
        .then (response) =>
          @toaster.pop 'success', 'IP whitelisting updated successfully!'
          @close(response)
        .finally =>
          @loading = false
      , (error) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Adding new whitelisting IP failed', error)
