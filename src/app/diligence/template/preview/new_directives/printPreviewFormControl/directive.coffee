###
<print-preview-form-control data-ng-model="response">
</print-preview-form-control>
###
angular.module('diligenceVault').directive 'printPreviewFormControl', (QuestionnaireWidgetFactory, $compile) ->
  restrict: 'E'
  templateUrl: 'diligence/template/preview/new_directives/printPreviewFormControl/template.html'
  require: ['?^questionnairePrintPreview']
  scope: true
  replace: true
  controller: 'PrintPreviewFormControlController'
  controllerAs: 'vm'
  link: (scope, element, attrs, controllers) ->

    questionnaireController = controllers[0]
    scope.questionnaireController = questionnaireController
    scope.element = element

    scope.init= =>

      renderControlWidget = (response) ->
        if questionnaireController
          responseType = response.question.attributes.responseType
          analytics_mode = false
          preview = questionnaireController.preview
          is_NA = response.attributes.is_NA
          full_width_widgets = ['TextMultiLine', 'aumTable', 'Grid',
                                'ReturnTable', 'BooleanPlus', 'NoPlus','DynamicGrid']
          template = QuestionnaireWidgetFactory.getWidgetTemplate(responseType, scope.readonly, preview, analytics_mode, is_NA, scope.printPreview)

          $widget_container = element.find('.js-qa-widget')

          if responseType in full_width_widgets
            $widget_container.addClass('full-width')

          $widget_container.html $compile(template)(scope)

          if responseType == 'Attachment' && !response.attachments
            response.attachments = []

      renderScore = (response) ->
        score = response.question.score

        return unless score?

        element.find('.js-dd-score-display-container').html(
          $compile("""<dd-score score="response.question.score.attributes.score"
                                total="response.question.score.attributes.total"></dd-score>""")(scope)
        )

      renderControlWidget(scope.response)
      renderScore(scope.response)

    scope.init()
