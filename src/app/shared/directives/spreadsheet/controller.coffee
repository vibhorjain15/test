class SpreadsheetController extends BaseController
  @register 'SpreadsheetController'

  @inject '$attrs', '$scope', '$rootScope', '$stateParams', '$timeout'

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