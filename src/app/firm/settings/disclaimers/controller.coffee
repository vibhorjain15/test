class FirmSettingsDisclaimersController extends BaseController
  @register 'FirmSettingsDisclaimersController'
  @inject '$state', 'DisclaimersResource', 'SweetAlert', 'Restangular', 'toaster', 'ModalFactory', 'Utils','angularEnabled', '$window'

  initialize: ->
    @disclaimers_type = 'active'
    @activeFlagForDisclaimerApi = true
    @renderGrid = true
    @disclaimers = @DisclaimersResource.$new({is_active: if @activeFlagForDisclaimerApi then true else false})
    @isManager = @Utils.isManager()
    if !@isManager
      @$window.history.back()
      return

  confirmDisclaimerDeletion: (disclaimer) ->
    title = 'Are you sure you want to delete this disclaimer?'
    warningText = 'This disclaimer will be disassociated from ' + disclaimer.usage + ' diligences'

    @SweetAlert.confirm({
      title: title
      text: warningText
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteDisclaimer(disclaimer)
    })

  deleteDisclaimer: (disclaimer) ->
    @Restangular.one('disclaimers', disclaimer.id).remove().then =>
      swal.close()
      @toaster.pop 'success', '', 'Disclaimer deleted successfully'
      @refreshDisclaimerData()


  addDisclaimer: ->
    @ModalFactory.invokeModal 'manage_disclaimer',
      success: (disclaimer) =>
        @refreshDisclaimerData()

  refreshDisclaimerData: =>
    @disclaimers.fetch({is_active: if @activeFlagForDisclaimerApi then true else false})
    @renderGrid = true
    @loading = false

  setDisclaimerType: (type) =>
    @disclaimers_type = type
    @renderGrid = false
    @loading = true
    if @disclaimers_type == 'inactive'
      @activeFlagForDisclaimerApi = false
      @refreshDisclaimerData()
    else
      @activeFlagForDisclaimerApi = true
      @refreshDisclaimerData()

  viewDisclaimer: (disclaimer) =>
    @ModalFactory.invokeModal 'view_disclaimer',
      resolve:
        id: => disclaimer.id

  editDisclaimer: (disclaimerObj) ->
    if disclaimerObj.usage <= 0
      @ModalFactory.invokeModal 'manage_disclaimer',
        resolve:
          disclaimer: => disclaimerObj
        success: (disclaimer) =>
          @refreshDisclaimerData()
