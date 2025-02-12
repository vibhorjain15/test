class DynamicSpreadsheetController extends BaseController
  @register 'DynamicSpreadsheetController'

  @inject '$attrs', '$scope', '$rootScope', '$stateParams', '$timeout', 'SweetAlert'

  initialize: ->
    readonly = angular.isDefined(@$attrs.readonly)

    if angular.isDefined(@$stateParams.templateId || @$stateParams.reportId || @$stateParams.diligenceId)
      deregisterer = @$scope.$parent.$watch @$attrs.response, (response) =>
        if response?
          response.initialized.then =>
            @$timeout =>
              @$scope.render(response, readonly)

          deregisterer()

    @$rootScope.$on 'questionnaire:render', =>
      response = @$scope.$parent.$eval @$attrs.response
      response.initialized.then =>
        @$scope.render(response, readonly)
        response.grid_already_rendered_once = true
        ###if response
          @watchForGridChanges()###

    deregisterer_two = @$scope.$parent.$watch @$attrs.response, (response) =>
      if response && response.grid_already_rendered_once
        response.initialized.then =>
          @$timeout =>
            @$scope.render(response, readonly)
        deregisterer_two()

  addCustomRows: () ->
    @SweetAlert.input({
      title: 'Enter number of rows'
      input: 'text'
      showCancelButton: true
      closeOnConfirm: false
    }).then (response) =>
      regex = /^[1-9]\d*$/
      if response.value
        is_valid_digit_number = regex.test(response.value)
        if is_valid_digit_number
          if Number(@$scope.response_new.rows.length) + Number(response.value) > 2000
            @SweetAlert.error({'title':'You can only add a total of 2000 rows','text': ''})
          else
            @$scope.addRowOrColumn(response.value)
            swal.close()
        else
          @SweetAlert.error({'title':'Invalid input','text': 'Enter a valid number'})
      else
        swal.close()



  watchForGridChanges: () =>
    readonly = angular.isDefined(@$attrs.readonly)
    @$scope.$parent.$watch @$attrs.response, (response) =>
      if response?
        response.initialized.then =>
          @$timeout =>
            @$scope.render(response, readonly)

