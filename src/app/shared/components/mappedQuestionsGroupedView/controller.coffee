class MappedQuestionsGroupedViewController extends BaseController
    @register 'MappedQuestionsGroupedViewController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','toaster','$http','SweetAlert','baseUrl'


    confirmRemoveQuestion: (question,level, index) ->
        title = 'Are you sure you want to delete this mapping?'

        @SweetAlert.confirm({
            title: title
            focusCancel: true
            showLoaderOnConfirm: true
            preConfirm: =>
                @removeQuestion(question, level, index)
        })

    removeQuestion: (selectedItem, level, index)=>
        if level == 'group-header'
            params = 
                template_id: @template.templateInfo.id
                template_version: @template.version
                section_id: @question.sectionID
                question_id: @question.id
                mapped_template_id: selectedItem.mapped_template_id
                mapped_template_version: selectedItem.mapped_template_version
                mapped_questions: _(selectedItem.questions).map (question)=>
                    mapped_section_id: question.mapped_section_id
                    mapped_question_id: question.mapped_question_id
        else
            params = 
                template_id: @template.templateInfo.id
                template_version: @template.version
                section_id: @question.sectionID
                question_id: @question.id
                mapped_template_id: selectedItem.mapped_template_id
                mapped_template_version: selectedItem.mapped_template_version
                mapped_questions: [
                    {
                        mapped_section_id: selectedItem.mapped_section_id
                        mapped_question_id: selectedItem.mapped_question_id
                    }
                ]
        @$http.delete(@baseUrl + '/review_projects/mapping',data:params,headers: {'Content-Type': 'application/json;charset=utf-8'}).then (response)=>
            if level == 'group-header'
                delete @mappedQuestions[selectedItem.mapped_template_id]
            else
                if @mappedQuestions[selectedItem.mapped_template_id].questions.length > 1
                    @mappedQuestions[selectedItem.mapped_template_id].questions.splice(index,1)
                else
                    delete @mappedQuestions[selectedItem.mapped_template_id]

            @toaster.pop 'success','','Question mapping removed successfully'
            @onRemove()
            swal.close()
        ,(error)=>
            swal.close()

    collapseGroup: (template)=>
        template.isOpen = !template.isOpen

        _(@mappedQuestions).each (question)=>
            if question.mapped_template_id != template.mapped_template_id
                question.isOpen = false