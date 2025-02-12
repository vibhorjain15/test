class EPWalkThrough extends ModalController
  @register 'EPWalkThrough'
  @inject 'Utils', 'Restangular', '$window', 'AuthService'

  initialize: ->
    @slides = [
      {name: 'Category', step_no: 1, stepImg: 'https://prnt.sc/12ijv90'}
      {name: 'Question', step_no: 2, stepImg: 'https://prnt.sc/12iksft'}
      {name: 'Answer', step_no: 3, stepImg: 'https://prnt.sc/12iksvb'}
    ]
    @currentStep = 1
    @lastStep = 3
