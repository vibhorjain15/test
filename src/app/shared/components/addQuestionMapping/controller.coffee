class AddQuestionMappingController extends BaseController
    @register 'AddQuestionMappingController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','TemplatesDataService','toaster'

    initialize: ->
        @questionsList = []
        @entityDisplayParams = {
          id: 'id'
          name: 'text'
        }
        @badgeLabel = {
            label: 'nestedLabel'
            text: 'Nested'
            class: 'badge-success'
        }
        @entityFilterParams = {
            'section_id': 'sectionID'
        }

    onTemplateSelectionChanged: =>
        @TemplatesDataService.getCustomQuestions({template_id: @selected_template.templateInfo.id}).then (response) =>
            @questionsList = []
            
            @sectionSource = {}

            _(response).each (question)=>
                if not @sectionSource[question.sectionID]
                    @sectionSource[question.sectionID] = 
                        sectionID: question.sectionID
                        section_name: question.section_name

                question.nestedLabel = "Nested" if question.isNested
                if @mappedQuestions[@selected_template.templateInfo.id]
                    questionAlreadyAdded = _(@mappedQuestions[@selected_template.templateInfo.id].questions).pluck('mapped_question_id')
                    if !(question.id in questionAlreadyAdded)
                        @questionsList.push question
                else
                    @questionsList.push question

    save: =>
        return unless @addQuestionMappingForm.$valid

        if @selected_questions.length == 0
            @toaster.pop 'error','','Please select atleast one question'
            return

        @saving_mapping = true
        params = {
            template_id: @template.templateInfo.id
            template_version: @template.version
            section_id: @question.sectionID
            question_id: @question.id
            mapped_template_id: @selected_template.templateInfo.id
            mapped_template_version: @selected_template.version
            mapped_questions: []
        }
        params.mapped_questions = _(@selected_questions).map (question)=>
            mapped_section_id: question.sectionID
            mapped_question_id: question.id

        @Restangular.all('review_projects').all('mapping').post([params]).then (response)=>
            @saving_mapping = false
            @onSave({results:response})
        ,(error)=>
            @saving_mapping = false