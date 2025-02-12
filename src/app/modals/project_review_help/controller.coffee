class ProjectReviewHelpController extends ModalController

  @register 'ProjectReviewHelpController'

  @inject '$uibModalInstance', 'Restangular', '$timeout', 'toaster', 'Utils'

  initialize: ->

  dontShowAgain: ->
    @savingChoice = true
    @Restangular.all('users/review_intro').patch({ review_functionality_intro: true }).then((response) =>
      @toaster.pop 'success', '', 'We have saved your preference, we won\'t show this help again.'
      @cancel()
    )
    .finally(=>
      @savingChoice = false
    )

  cancel: ->
    @Utils.setReviewFunctionalityIntroDisplayOption(false)
    @$uibModalInstance.dismiss 'cancel'
