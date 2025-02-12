class FirmSettingsIpConfigurationController extends BaseController
  @register 'FirmSettingsIpConfigurationController'

  @inject 'Restangular', 'toaster', 'BaseDataService', 'Utils', 'toaster', 'ModalFactory', '$http', 'SweetAlert','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @getIPConfigurations()
    @getCurrentIP()

  getIPConfigurations: () =>
    @Restangular.all('ip_configurations').getList().then (response) =>
      @ip_configurations = response

      _(@ip_configurations).each (config, i) =>
        config.number_of_IPs = @Utils.getRangeOfIP(config.start_ip, config.end_ip)

  getCurrentIP: () =>
    @Restangular.all('ip_configurations/logged_in_ip_address').customGET().then (response) =>
      @currentIP = response.ip_address

  addIPConfig: ->
    @ModalFactory.invokeModal 'add_ipconfig',
      resolve:
        ip_configurations_length : => @ip_configurations.length
        current_ip : => @currentIP
      success: (result) =>
        result.number_of_IPs = @Utils.getRangeOfIP(result.start_ip, result.end_ip)
        @ip_configurations.push(result)

  removeIPConfiguration: (configuration, idx) =>
    @Restangular.one('ip_configurations', configuration.id).remove()
    .then (response) =>
      swal.close()
      @ip_configurations.splice(idx, 1)
      @toaster.pop 'success', '', 'IP whitelisting successfully removed!'
    , (error) =>
      @toaster.pop 'error', 'Unable to remove IP whitelisting!'
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Deleting IP whitelisting failed', error)
    .finally(=>
      swal.close()
    )

  confirmRemoveIP: (configuration, idx) =>
    @SweetAlert.confirm({
        title: "Are you sure you want to remove this IP whitelisting?"
        confirmButtonText: 'Remove'
        focusCancel: true
        showLoaderOnConfirm: true
        preConfirm:=>
          @removeIPConfiguration(configuration, idx)
    })
