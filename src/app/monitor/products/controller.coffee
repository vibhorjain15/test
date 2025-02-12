class MonitorProductsController extends BaseController
  @register 'MonitorProductsController'

  @inject 'Restangular', 'SweetAlert', '$timeout', 'Utils', 'ModalFactory', 'toaster', 'BaseDataService','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @entity_type = @Utils.getEntityType()

    @loading_funds = true
    @Restangular.all('funds').getList(profile: 'true').then (response) =>
      @fund_list = response
      @loading_funds = false

  editFund: (fund) ->
    @ModalFactory.invokeModal 'manage_fund',
      resolve:
        fund: => fund
        source: => 'monitor'
      success: (updated_fund) =>
        idx = _.indexOf(_.pluck(@fund_list, 'id'), updated_fund.id)
        @fund_list.splice(idx, 1, updated_fund)
        @$timeout =>
          #Because you want to adjust tiles after it is removed from the ng-repeat list
          @adjust_fund_list = true
      dismiss: (dismissObj) =>
        if dismissObj?
          fund = dismissObj

  displayFundRemovalConfirmation: (fund) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{fund.name}\"?"
      confirmButtonText: 'Yes, delete fund'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeFund(fund)
    })

  removeFund: (fund) ->
    fund.remove()
    .then((response) =>
      @toaster.pop 'success', '', @entity_type+" deleted successfully"

      @fund_list.splice @fund_list.indexOf(fund), 1

      @$timeout =>
        #Because you want to adjust tiles after it is removed from the ng-repeat list
        @adjust_fund_list = true
    , (error) =>
      @toaster.pop 'error', '', 'Something went wrong. Please try again.'
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Deleting fund failed', error)
    ).finally =>
      swal.close()

  openNewFundDialog: () ->
    @ModalFactory.invokeModal 'manage_fund'
