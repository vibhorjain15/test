angular.module('diligenceVault').directive 'rbFundOverview', (FundDataservice, $q, $compile, $rootScope,Utils) ->
  restrict: 'E'
  template: '<div></div>'
  link: (scope, element) ->

    scope.showInfoModelControls = [false, false, false, false, false, false]
    scope.selectedInfoModel = [false, false, false, false, false, false]

    options = eval scope.component.options
    scope.isEntityAssociated = (eval options.entity_id)?

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    getRandomFundValues = ->
      response =
        is_PE: true
        is_category3: false
        profile_data:
          'id': 1
          'category': 'Fund Raising'
          'fund_aum': 450
          'inception_date': '1-Aug-12'
          'hwm': 'Yes'
          'cio': 'Milano Garcia'
          'firm_aum': 960
          'fund_count': 1
          'employee_count': 15
          'investor_count': 10
          'firm_ownership': '100%'
          'name': 'IFCI Sycamore Brazil Infrastructure Fund'
          'strategy': 'Infrastructure'
          'performance_fee': null
          'management_fee': 2
          'carry_fee': 18
          'structure': 'PE'

      deferred = $q.defer()
      deferred.resolve(response)
      deferred.promise

    getFundOverviewData = (entity_id) ->
      return getRandomFundValues()
      ###return getRandomFundValues() unless entity_id?
      FundDataservice.getFundProfile(entity_id)###

    getFundOverviewData(scope.component.options.entity_id).then (response) ->
      scope.fund_overview = response

    scope.selectInfoModel = (infoModel, idx) ->
      if !scope.reportBuilderController.readonly
        if scope.reportBuilderController.active_component_controller.component.cid == scope.component.cid
          Utils.fillArray(scope.selectedInfoModel,false)
          scope.selectedInfoModel[idx] = true
          $rootScope.$broadcast 'activate_overview_component', infoModel, idx, scope.component.cid

    scope.removeInfoModel = (idx) ->
      $rootScope.$broadcast 'remove_overview_component', idx, scope.component.cid

    scope.clearInfoModelSelection = () ->
      Utils.fillArray(scope.selectedInfoModel,false)

    scope.$on 'clear_info_model_selection', (event, cid) =>
      if cid == scope.component.cid
        scope.clearInfoModelSelection()

    scope.$render = ->

      scope.infoList = eval options.infoList

      template = """
          <div class="panel panel-default">
              <div class="panel-heading clearfix">
                  <span class="pull-left"><b>#{options.entity_name}</b></span>
              </div>

              <div class="panel-body full-height align-middle">
                  <div data-ng-if="infoList.length">
                      <p class="alert alert-warning" ng-if="!isEntityAssociated && !reportBuilderController.readonly">
                          <strong>Note:</strong> This is Report Definition view, and selected questions/responses won't appear here.
                      </p>

                      <table class="fund-profile-items space-on-top space-on-bottom">
                        <tbody data-ng-class="{ 'clickable': reportBuilderController.active_component_controller.component.cid == component.cid }">
                            <tr class="title-row">
                                <td height='100%' class="title-cell" data-ng-repeat="infoModel in infoList track by $index"
                                     data-ng-class="{ 'title-cell-hover': showInfoModelControls[$index] && reportBuilderController.active_component_controller.component.cid == component.cid,
                                                      'title-cell-select': selectedInfoModel[$index] && reportBuilderController.active_component_controller.component.cid == component.cid }"
                                     data-ng-mouseenter="$parent.showInfoModelControls[$index] = true"
                                     data-ng-mouseleave="$parent.showInfoModelControls[$index] = false"
                                     data-ng-click="selectInfoModel(infoModel, $index)">
                                    <div class="relative inner">
                                        <small class="text-uppercase max-w-200 lh1-5 word-break-break-all">{{infoModel.label}}</small>
                                        <div class="info-model-controls" data-ng-if="showInfoModelControls[$index] && reportBuilderController.active_component_controller.component.cid == component.cid">
                                            <icon name="trashcan"
                                              class="clickable danger"
                                              uib-tooltip="Delete this component"
                                              ng-click="$parent.removeInfoModel($index)">
                                            </icon>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr class="rb-icon-row">
                                <td height='100%' class="icon-cell" data-ng-repeat="infoModel in infoList track by $index"
                                      data-ng-class="{ 'icon-cell-hover': showInfoModelControls[$index] && reportBuilderController.active_component_controller.component.cid == component.cid,
                                                       'icon-cell-select': selectedInfoModel[$index] && reportBuilderController.active_component_controller.component.cid == component.cid }"
                                      data-ng-mouseenter="$parent.showInfoModelControls[$index] = true"
                                      data-ng-mouseleave="$parent.showInfoModelControls[$index] = false"
                                      data-ng-click="selectInfoModel(infoModel, $index)">
                                      <div class="inner">
                                        <icon name="{{infoModel.icon}}" size="2x"></icon>
                                      </div>
                                </td>
                            </tr>
                            <tr>
                                <td height='100%' class="response-cell" data-ng-repeat="infoModel in infoList track by $index"
                                      data-ng-class="{ 'response-cell-hover': showInfoModelControls[$index] && reportBuilderController.active_component_controller.component.cid == component.cid,
                                                       'response-cell-select': selectedInfoModel[$index] && reportBuilderController.active_component_controller.component.cid == component.cid }"
                                      data-ng-mouseenter="$parent.showInfoModelControls[$index] = true"
                                      data-ng-mouseleave="$parent.showInfoModelControls[$index] = false"
                                      data-ng-click="selectInfoModel(infoModel, $index)">
                                      <div class="inner">
                                        <small class="text-muted" data-ng-if="!isEntityAssociated && infoModel.questionId">
                                          <i>*N/A*</i>
                                        </small>
                                        <small data-ng-if="isEntityAssociated && infoModel.questionId">
                                            <span class="max-w-200 lh1-5 word-break-break-all"
                                                  data-ng-if="!(infoModel.response == null || infoModel.response == '' || infoModel.response == undefined)"
                                                  dv-supplant-content supplant-content="infoModel.response" supplant-options="component.options">
                                            </span>

                                            <span class="text-muted" data-ng-if="(infoModel.response == null || infoModel.response == '' || infoModel.response == undefined)">
                                              <i>*No response available*</i>
                                            </span>
                                        </small>
                                      </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                  </div>

                  <p class="alert alert-info text-center" data-ng-if="!infoList.length">
                      <i>*No components available to show*</i>
                  </p>
              </div>
          </div>
        """

      displaySpinner()

      element.html $compile(template)(scope)

    scope.$render()
