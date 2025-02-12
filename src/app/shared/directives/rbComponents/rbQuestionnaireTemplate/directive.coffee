angular.module('diligenceVault').directive 'rbQuestionnaireTemplate', ($compile, DueDiligenceDataservice, $q, $rootScope, $state, toaster, rbQuestionnaireUtils,Utils) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    scope.responsesChanged = false
    scope.editingQuestion = []
    scope.editedQuestionsText = []

    scope.$render = ->

      scope.tinymceOptions =
        init_instance_callback: (editor) =>
          editor.on 'blur', ->
            if scope.responsesChanged
              scope.saveResponse()
              scope.$apply()

        skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
        browser_spellcheck: true
        plugins: "paste hr textcolor colorpicker fullscreen"
        custom_undo_redo_levels: 10
        toolbar1: 'bold italic strikethrough | alignleft aligncenter alignright alignjustify |'
        toolbar2: 'undo redo | hr forecolor fontselect |'
        toolbar3: 'formatselect fontsizeselect | fullscreen |'
        menubar: false
        statusbar: false
        image_dimensions: false
        height: '100'
        force_br_newlines: false
        force_p_newlines: false
        content_css: 'assets/stylesheets/tiny_mce_custom.css'
        table_toolbar: ""

      scope.tinymceOptionsSmall = angular.copy scope.tinymceOptions
      scope.tinymceOptionsSmall.toolbar1 = 'bold italic strikethrough |'
      scope.tinymceOptionsSmall.toolbar2 = 'alignleft aligncenter alignright |'
      scope.tinymceOptionsSmall.toolbar3 = 'alignjustify hr | fullscreen |'

      options = eval scope.component.options
      scope.templateId = eval options.templateId
      scope.entity_id = eval options.entity_id
      scope.entity_type = options.entity_type
      scope.selectedQuestionsList = eval options.selectedQuestionsList
      scope.isEntityAssociated = (eval options.entity_id)?
      scope.layout = if options.view == 'side-by-side' then 'side-by-side' else 'horizontal'
      colSize = if options.view == 'side-by-side' then 6 else 12

      Utils.fillArray(scope.editingQuestion,false)

      if scope.isEntityAssociated
        scope.loading_responses = true
        promises = []
        _(scope.selectedQuestionsList).each (question) =>
          if !question.textResponse
            promises.push DueDiligenceDataservice.getReportQuestionResponse({entity_type: scope.entity_type, entity_id: scope.entity_id, question_id: question.id}).then (question_response) =>
              question.textResponse = if question_response then question_response else ''

          scope.editedQuestionsText.push ''
          scope.editingQuestion.push false

        $q.all(promises).then =>
          scope.loading_responses = false
          if !scope.reportBuilderController.readonly && !_.isEqual(eval(options.selectedQuestionsList), JSON.parse(angular.toJson(scope.selectedQuestionsList)))
            scope.component.options.selectedQuestionsList = JSON.stringify scope.selectedQuestionsList


      template = """
          <h4 class="clear-margin-top text-center text-uppercase">#{options.title}</h4>
          <div ng-if="!selectedQuestionsList.length">
              <p>Selected questions will appear here.<p>
          </div>
          <div ng-if="selectedQuestionsList.length">
              <p class="alert alert-warning" ng-if="!isEntityAssociated && !reportBuilderController.readonly">
                   <strong>Note:</strong> This is Report Definition view, and responses added here will not be saved.
              </p>
              <div class="pa-tb-lg avoid-page-break-inside space-on-bottom"
                   data-ng-class="{'dashed-border-at-bottom': isEntityAssociated && reportBuilderController.readonly}"
                   data-ng-repeat='question in selectedQuestionsList'>
                  <div class="full-width row clearfix">
                      <div class="space-on-bottom" data-ng-if='!isEntityAssociated'>
                          <div col="#{colSize}" class="relative"
                               data-ng-class="{'space-on-bottom': layout === 'horizontal'}"
                               data-ng-mouseenter="showQuestionControls = true"
                               data-ng-mouseleave="showQuestionControls = false">
                              <div class="question-controls" data-ng-if="showQuestionControls && !editingQuestion[$index]">
                                  <icon name="pencil"
                                        class="clickable"
                                        uib-tooltip="Edit Question"
                                        ng-click="editQuestion(question, $index)">
                                  </icon>
                              </div>
                              <div class="question-controls text-center" data-ng-if="showQuestionControls && editingQuestion[$index]">
                                  <icon name="floppy-disk"
                                        class="space-on-bottom-lg clickable"
                                        uib-tooltip="Save Question"
                                        ng-click="saveQuestion(question, $index)">
                                  </icon>
                                  <icon name="close"
                                        class="clickable danger"
                                        uib-tooltip="Cancel Edit"
                                        ng-click="cancelQuestionEditing($index)">
                                  </icon>
                              </div>
                              <div class="qa-question space-on-top js-qa-question" data-ng-if="!editingQuestion[$index]">
                                  <span dv-supplant-content supplant-content="question.text" supplant-options="component.options"></span>
                              </div>
                              <textarea ui-tinymce="tinymceOptionsSmall"
                                  class="form-control"
                                  data-ng-if="layout !== 'horizontal' && editingQuestion[$index]"
                                  data-ng-model="editedQuestionsText[$index]"></textarea>
                              <textarea ui-tinymce="tinymceOptions"
                                  class="form-control"
                                  data-ng-if="layout === 'horizontal' && editingQuestion[$index]"
                                  data-ng-model="editedQuestionsText[$index]"></textarea>
                          </div>
                          <div data-ng-class="{'bordered-left': layout !== 'horizontal'}" col="#{colSize}">
                              <textarea ui-tinymce="tinymceOptionsSmall"
                                  class="form-control"
                                  data-ng-if="layout !== 'horizontal'"
                                  data-ng-model="question.textResponse"></textarea>
                              <textarea ui-tinymce="tinymceOptions"
                                  class="form-control"
                                  data-ng-if="layout === 'horizontal'"
                                  data-ng-model="question.textResponse"></textarea>
                          </div>
                      </div>
                      <div class="space-on-top-xl space-on-bottom-lg" data-ng-if="loading_responses && reportBuilderController.readonly">
                          <spinner spinner-text='Loading response'></spinner>
                      </div>
                      <div data-ng-if='isEntityAssociated && !(loading_responses && reportBuilderController.readonly)'>
                          <div col="#{colSize}" class="relative"
                               data-ng-class="{'space-on-bottom': layout === 'horizontal'}"
                               data-ng-mouseenter="showQuestionControls = true"
                               data-ng-mouseleave="showQuestionControls = false">
                              <div class="question-controls" data-ng-if="showQuestionControls && !reportBuilderController.readonly && !editingQuestion[$index]">
                                  <icon name="pencil"
                                        class="clickable block"
                                        uib-tooltip="Edit Question"
                                        ng-click="editQuestion(question, $index)">
                                  </icon>
                              </div>
                              <div class="question-controls text-center" data-ng-if="showQuestionControls && !reportBuilderController.readonly && editingQuestion[$index]">
                                  <icon name="floppy-disk"
                                        class="space-on-bottom-lg clickable"
                                        uib-tooltip="Save Question"
                                        ng-click="saveQuestion(question, $index)">
                                  </icon>
                                  <icon name="close"
                                        class="clickable danger"
                                        uib-tooltip="Cancel Edit"
                                        ng-click="cancelQuestionEditing($index)">
                                  </icon>
                              </div>
                              <div class="qa-question space-on-top js-qa-question" data-ng-if="!editingQuestion[$index]">
                                  <span dv-supplant-content supplant-content="question.text" supplant-options="component.options"></span>
                              </div>
                              <textarea ui-tinymce="tinymceOptionsSmall"
                                  class="form-control"
                                  data-ng-if="layout !== 'horizontal' && editingQuestion[$index]"
                                  data-ng-model="editedQuestionsText[$index]"></textarea>
                              <textarea ui-tinymce="tinymceOptions"
                                  class="form-control"
                                  data-ng-if="layout === 'horizontal' && editingQuestion[$index]"
                                  data-ng-model="editedQuestionsText[$index]"></textarea>
                          </div>
                          <div data-ng-class="{'bordered-left': layout !== 'horizontal'}" col="#{colSize}" data-ng-if="reportBuilderController.readonly">
                              <p data-ng-if="!(question.textResponse == null || question.textResponse == '' || question.textResponse == undefined)">
                                  <span dv-supplant-content supplant-content="question.textResponse" supplant-options="component.options"></span>
                              </p>

                              <small class="text-muted" data-ng-if="(question.textResponse == null || question.textResponse == '' || question.textResponse == undefined)">
                                  <i>*No response available*</i>
                              </small>
                          </div>
                          <div data-ng-class="{'bordered-left': layout !== 'horizontal'}" col="#{colSize}" data-ng-if='!reportBuilderController.readonly'>
                              <textarea ui-tinymce="tinymceOptionsSmall"
                                class="form-control"
                                data-ng-if="layout !== 'horizontal'"
                                data-ng-change='responseChanged()'
                                data-ng-model="question.textResponse"></textarea>
                              <textarea ui-tinymce="tinymceOptions"
                                class="form-control"
                                data-ng-if="layout === 'horizontal'"
                                data-ng-change='responseChanged()'
                                data-ng-model="question.textResponse"></textarea>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      """

      displaySpinner()

      element.html $compile(template)(scope)

    scope.$render()

    scope.responseChanged = =>
      scope.responsesChanged = true

    scope.saveResponse = =>
      toaster.pop 'info', '', "Auto-saving your response"
      scope.component.options.selectedQuestionsList = JSON.stringify scope.selectedQuestionsList
      scope.responsesChanged = false

    scope.editQuestion = (question, idx) =>
      scope.editingQuestion[idx] = true
      scope.editedQuestionsText[idx] = question.text

    scope.saveQuestion = (question, idx) =>
      scope.editingQuestion[idx] = false
      if !scope.isEntityAssociated
        _(scope.selectedQuestionsList).forEach (question) ->
          question.textResponse = ''
      scope.selectedQuestionsList[idx].text = scope.editedQuestionsText[idx]
      scope.saveResponse()

    scope.cancelQuestionEditing = (idx) =>
      scope.editingQuestion[idx] = false
