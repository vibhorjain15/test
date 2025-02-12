class DvNudgesController extends BaseController
  @register 'DvNudgesController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster', 'Utils', 'SweetAlert'

  initialize: ->
    @today = new Date()
    @currentTime = @today.getHours()
    @selectedNudge = {}
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.nudges], (values) =>
      if values[0]
        @selectedNudge = values[0]
        deregisterer()

    if @currentTime < 4
     @lead_text = 'Sleep is a good thing. Get some rest!'
    else if @currentTime < 7
     @lead_text = 'You are getting an early start!'
    else if @currentTime < 10
      @lead_text = 'Good Morning!'
    else if @currentTime < 12
      @lead_text = 'Have an awesome day!'
    else if @currentTime < 16
      @lead_text = 'Good Afternoon!'
    else if @currentTime < 18
      @lead_text = 'Good Evening!'
    else
      @lead_text = 'Hi there Vaulter!'
