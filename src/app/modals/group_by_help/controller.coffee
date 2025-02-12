class GroupByHelpController extends ModalController

  @register 'GroupByHelpController'

  @inject '$uibModalInstance', 'Restangular', '$timeout', 'toaster', 'Utils'

  initialize: ->

  dontShowAgain: ->
    @savingChoice = true
    @Restangular.all('users/group_by_intro').customPUT({ group_by_intro: true }).then((response) =>
      @toaster.pop 'success', '', 'We have saved your preference, we won\'t show this help again.'
      @cancel()
    )
    .finally(=>
      @savingChoice = false
    )

  cancel: ->
    @Utils.setGroupByIntroDisplayOption(false)
    @$uibModalInstance.dismiss 'cancel'
