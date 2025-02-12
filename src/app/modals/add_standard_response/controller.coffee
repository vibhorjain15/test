class AddStandardResponseController extends ModalController
    @register 'AddStandardResponseController'

    @inject 'toaster', 'Restangular', 'ReportTemplateDataservice','$state', 'baseUrl', 'ModalFactory', 'response', 'diligence' ,'$timeout', 'mapped_diligences', 'mapped_questions', 'mapped_questions_array', '$q', 'Utils'

    initialize: ->
      @responseOptions = ['investment partners', 'managers', 'clients']
      @responseText1 = ""
      @standardText = {}
      @templates = []
      @templateQuestions = []
      @selfResponses = []
      @loading = true
      @mappedResponseTagsArray = []
      @mappedQuestionTagsArray = []
      if @response
        @templateId = @diligence.template_id
        promises = []
        promises.push @getStandardTextForQuestion()
        promises.push @getQuestionsWithTemplateId()
        promises.push @getMappedResponses()
        promises.push @getAllWidgets()
        promises.push @getProjectTagValues()
        promises.push @getV2Responses()

        @$q.all(promises).then =>
          if @mapped_questions and @mapped_questions.length
            for mapped_question in @mapped_questions
              for innerQuestions in mapped_question.mapped_questions
                obj = {tag: mapped_question.mapped_template_id+ "_" +innerQuestions.question_group_id + "_1"}
                @mappedQuestionTagsArray.push obj
          @$timeout =>
            @autoFillTags()

    getQuestionsWithTemplateId: =>
      @Restangular.all('questions').customGET('', {template_id: @diligence.template_id}).then (response) =>
        @templateQuestions = response
        for templateQuestion in @templateQuestions
          templateQuestion.tag = 'self_' + templateQuestion.group_id

    getProjectTagValues: =>
      @Restangular.one('diligences', @diligence.id).all('project_tag_values').customGET().then (response) =>
        @projectTags = response

    getV2Responses: =>
      @Restangular.one('/v2/diligences/', @diligence.id).one('responses').customGET().then (response) =>
        @selfResponses = response
        for selfResponse in @selfResponses
          selfResponse.tag = 'self_' + selfResponse.questionID

    getMappedResponses: =>
      question_ids = _(@mapped_questions_array).pluck('mapped_question_id')
      if question_ids.length
        params = {
          mapped_diligence_ids: _(@mapped_diligences).pluck('id')
          mapped_question_ids: _(@mapped_questions_array).pluck('mapped_question_id')
        }
        @Restangular.all('review_projects').customPOST(params,'responses').then (response)=>
          @mapped_responses = response
          @mappedResponseTagsArray = []
          alreadyAdded = []
          selectedMappedTag = {}
          for mapped_response in @mapped_responses
            tag = mapped_response.template_id+ "_" +mapped_response.question_group_id + "_1"
            if alreadyAdded.indexOf(mapped_response.question_group_id) == -1
              @mappedResponseTagsArray.push {tag:tag, response: mapped_response.responseDisplay, questionId: mapped_response.question_group_id}
              alreadyAdded.push mapped_response.question_group_id
            else
              index = _(@mappedResponseTagsArray).findIndex (mappedRes)=> mappedRes.questionId ==  mapped_response.question_group_id
              @mappedResponseTagsArray[index].response = @mappedResponseTagsArray[index].response + "<br>" + mapped_response.responseDisplay

    getAllWidgets: =>
      @Restangular.all('widgets').getList().then (response) =>
        @customTagsArr = response

    capitalizeFirstLetter: (string) ->
      string.charAt(0).toUpperCase() + string.slice(1)

    autoFillTags: =>
      @loading = false
      if @standardText.text and @standardText.text.length
        for responseTag in @mappedResponseTagsArray
          if @standardText.html.indexOf(responseTag.tag) > -1
            @standardText.html = @Utils.replaceGlobally(@standardText.html, "{{"+responseTag.tag+"}}", responseTag.response)

        for questionTag in @mappedQuestionTagsArray
          if @standardText.html.indexOf(questionTag.tag) > -1
            @standardText.html = @Utils.replaceGlobally(@standardText.html, "{{"+questionTag.tag+"}}", " ")

        for response in @selfResponses
          if @standardText.html.indexOf(response.tag) > -1
            @standardText.html = @Utils.replaceGlobally(@standardText.html, "{{"+response.tag+"}}", response.responseDisplay)

        for templateQues in @templateQuestions
          if @standardText.html.indexOf(templateQues.tag) > -1
            @standardText.html = @Utils.replaceGlobally(@standardText.html, "{{"+templateQues.tag+"}}", " ")

        for key, value of @projectTags
          if @standardText.html.indexOf(@capitalizeFirstLetter(key)) > -1
            @standardText.html = @Utils.replaceGlobally(@standardText.html, "{{"+@capitalizeFirstLetter(key)+"}}", value)
          else
            str = "-"
            @standardText.html = @Utils.replaceGlobally(@standardText.html, "{{"+@capitalizeFirstLetter(key)+"}}", str)

    handleUploadError: (response) =>
      @loading = false

    getStandardTextForQuestion: =>
      @Restangular.one('templates', @templateId).one('questions', @response.question.id).all('standardized_texts').customGET().then (response) =>
        if response
          @standardText = response

    countInstances: (string, word) ->
      string.split(word).length - 1

    submit: =>
      if @standardText.text and @standardText.text.length
        result = @standardText
        previewText = @standardText.html
        for widget in @customTagsArr
          if @standardText.text.indexOf(widget.tag) > -1
            if widget.type == 'dropdown'
              if $( "#"+widget.tag+"" ).val() != undefined
                if !$( "#"+widget.tag+"" ).val()
                  @toaster.pop 'error', 'Please select option in dropdown'
                  return
                $( "#"+widget.tag+"" ).replaceWith( "<span>"+$( "#"+widget.tag+"" ).val()+"</span>" )
            else
              if $( "#"+widget.tag+"_date" ).val() != undefined
                if !$( "#"+widget.tag+"_date" ).val()
                  @toaster.pop 'error', 'Please select a date'
                  return
                $( "#"+widget.tag+"_date" ).replaceWith( "<span>"+$( "#"+widget.tag+"_date" ).val()+"</span>" )
            count = @countInstances(@standardText.text, widget.tag)
            if count > 0
              i = 1
              while i <= count
                newTag = "{{"+widget.tag+"_"+i+"}}"
                if @standardText.text.indexOf(newTag) > -1
                  if widget.type == 'dropdown'
                    if $( "#"+widget.tag+"_"+i ).val() != undefined
                      if !$( "#"+widget.tag+"_"+i ).val()
                        @toaster.pop 'error', 'Please select option in dropdown'
                        return
                      $( "#"+widget.tag+"_"+i ).replaceWith( "<span>"+$( "#"+widget.tag+"_"+i ).val()+"</span>" )
                  else
                    if $( "#"+widget.tag+"_"+i+"_date" ).val() != undefined
                      if !$( "#"+widget.tag+"_"+i+"_date" ).val()
                        @toaster.pop 'error', 'Please select a date'
                        return
                      $( "#"+widget.tag+"_"+i+"_date" ).replaceWith( "<span>"+$( "#"+widget.tag+"_"+i+"_date" ).val()+"</span>" )
                i++
        @close($("#preview").html())
