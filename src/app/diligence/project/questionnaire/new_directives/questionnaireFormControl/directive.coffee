###
<questionnaire-form-control data-ng-model="response">
</questionnaire-form-control>
###
angular.module('diligenceVault').directive 'questionnaireFormControl', (QuestionnaireWidgetFactory, $compile, Utils, dvThresholds, responseStatus) ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaireFormControl/template.html'
  require: ['?^questionnaire', '?^questionnairePreview', '?^displayQuestionnaire']
  scope: true
  replace: true
  controller: 'QuestionnaireFormControlController'
  controllerAs: 'vm'
  link: (scope, element, attrs, controllers) ->
    questionnaireController = controllers[0] || controllers[1] || controllers[2]
    scope.questionnaireController = questionnaireController
    scope.element = element # used to scroll to the element in case of error
    previous_active_icon = null
    $empty_icon = element.find('.js-empty-icon')
    $mandatory_icon = element.find('.js-mandatory-icon')
    $dirty_icon = element.find('.js-dirty-icon')
    $error_icon = element.find('.js-error-icon')
    $valid_icon = element.find('.js-valid-icon')
    if attrs.printPreview
      scope.printPreview = true
    else
      scope.printPreview = false

    scope.init= =>
      renderControlWidget = (response) ->
        if questionnaireController
          responseType = response.question.attributes.responseType
          analytics_mode = questionnaireController.analytics_mode
          scope.readonly = response.sequence.section.readonly
          scope.isReadonlyEditable = response.sequence.section.isReadonlyEditable
          scope.isReadonlyNotEditable = response.sequence.section.isReadonlyNotEditable
          preview = questionnaireController.preview
          print_preview = questionnaireController.printPreview
          is_NA = response.attributes.is_NA
          full_width_widgets = ['TextMultiLine', 'aumTable', 'Grid','DynamicGrid',
                                'ReturnTable', 'BooleanPlus', 'NoPlus']
          
          if scope.isReadonlyEditable
            response.timeDiff = moment().diff(Utils.getLocalDateTime(response.verifier.attributes.completed_at),'milliseconds') if response.verifier and response.verifier.attributes.is_complete
            if (response.verifierEdit or response.attributes.response_status == responseStatus.STARTED or (response.attributes.response_status == responseStatus.REVIEWSUCCESS and response.verifier and response.verifier.attributes.is_complete and (typeof response.timeDiff == 'number' && response.timeDiff > 0)) or (response.attributes.response_status == responseStatus.REVIEWFAILED and (typeof response.timeDiff == 'number' && response.timeDiff > dvThresholds.REVIEW_TIMELIMIT)))
              if ((response.attributes.response_status == responseStatus.REVIEWSUCCESS and (typeof response.timeDiff == 'number' && response.timeDiff <= dvThresholds.REVIEW_TIMELIMIT)) or (response.attributes.response_status == responseStatus.REVIEWFAILED and (typeof response.timeDiff == 'number' && response.timeDiff > dvThresholds.REVIEW_TIMELIMIT))) and !response.verifierEdit and response.responses_history
                template = QuestionnaireWidgetFactory.getWidgetTemplate(responseType, false, preview, analytics_mode, is_NA,print_preview, questionnaireController.firm_preferences.enable_track_changes)
              else
                template = QuestionnaireWidgetFactory.getWidgetTemplate(responseType, false, preview, analytics_mode, is_NA,print_preview, false)
            else
              template = QuestionnaireWidgetFactory.getWidgetTemplate(responseType, true, preview, analytics_mode, is_NA,print_preview)
          else
            template = QuestionnaireWidgetFactory.getWidgetTemplate(responseType, scope.readonly, preview, analytics_mode, is_NA,print_preview)
          $widget_container = element.find('.js-qa-widget:first')

          if responseType in full_width_widgets
            $widget_container.addClass('full-width')

          $widget_container.html $compile(template)(scope)

          if analytics_mode
            element.addClass('analytics-mode')

          if scope.readonly or analytics_mode
            element.find('.js-delete-button').remove()
            element.find('.js-qafc-indicator').remove()
            element.find('.js-qa-question').addClass('dimmed')

          ###The code below has been added to init the upload file property binding 'attachments', which was undefined earlier###
          if responseType == 'Attachment' && !response.attachments
            response.attachments = []

      renderScore = (response) ->
        score = response.question.score

        return unless score?

        element.find('.js-dd-score-display-container').html(
          $compile("""<dd-score score="response.question.score.attributes.score"
                                total="response.question.score.attributes.total"></dd-score>""")(scope)
        )

      # we could have just used ng-class on those elements but this page could have 100s of controls
      # which means 100s * 4 watch expressions which run on every $digest cycle!
      # The following code although ugly looking can have some performance gain
      
      renderControlWidget(scope.response)
      renderScore(scope.response)

      if questionnaireController
        if questionnaireController.noResponseControls
          element.find('.js-response-controls').remove()

        if questionnaireController.noResponseIndicator
          element.find('.js-qafc-indicator').remove()

    scope.toggleIconDisplay = (response) =>
      display_mandatory_icon = response.question.attributes.is_mandatory && response.is_empty && !response.is_dirty
      display_empty_icon = response.is_empty && response.is_valid && !response.is_dirty
      display_dirty_icon = response.is_valid && response.is_dirty
      display_error_icon = !response.is_valid
      display_valid_icon = response.is_valid && !response.is_empty && !response.is_dirty

      if display_mandatory_icon
        active_icon = $mandatory_icon
      else if display_empty_icon
        active_icon = $empty_icon
      else if display_dirty_icon
        active_icon = $dirty_icon
      else if display_error_icon
        active_icon = $error_icon
      else if display_valid_icon
        active_icon = $valid_icon

      if previous_active_icon isnt active_icon
        previous_active_icon?.addClass('hidden')
        active_icon.removeClass('hidden')

        previous_active_icon = active_icon

    #scope.init()
