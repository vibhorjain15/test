class MoveQuestionController extends ModalController
  @register 'MoveQuestionController'

  @inject 'Restangular', 'selectedEntities', 'templateId', 'entityId', 'toaster', 'entityType', 'templateVersion', 'soureSectionId','Utils','SweetAlert','ERROR_CODES','$state'

  initialize: ->
    @loading_sections = true
    @sections = {}
    @Restangular.one('templates', @templateId).one('versions',@templateVersion).all('sections').getList() .then (response) =>
      #loop through the sections array and get all the parent sections
      _(response).each (item)=>
        if item.isParent
          @sections[item.id] = item
          item.sections = []
        
        #if this item is the current parent of the question/subsection, initialize the variable accordingly
        if item.id == Number(@soureSectionId)
          @currentParent = item
          @currentParent.selected = true

      #loop through the sections array and if the item is a child section then add this child sections inside the 
      #appropriate parent section's #sections array
      _(response).each (item)=>
        if not item.isParent
          @sections[item.parentID].sections.push item
    .finally =>
      @loading_sections = false

  moveQuestion: ->
    return unless @selectedEntity and @selectedEntity.selected

    if Number(@soureSectionId) == @selectedEntity.id
      @toaster.pop 'error','','Source and destination section cannot be same'
      return

    @saving = true
    params = {
      'source_section_id': Number(@soureSectionId)
      'destination_section_id': @selectedEntity.id
      'template_id': Number(@templateId)
      'template_version': @templateVersion
    }

    if @entityType == 'questions'
      params.questions = @selectedEntities
      @Restangular.all('questions').one('move').patch(params).then ((response)=>
        @close()
      ),((error) =>
        if error.status == @ERROR_CODES.BAD_REQUEST
          message = 'Refresh'
        else
          message = "Okay"
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: message
        }).then (isConfirm) =>
          if isConfirm and error.status == @ERROR_CODES.BAD_REQUEST
            @$state.go("app.diligence.template.preview",{templateId: @templateId})
          @close() if isConfirm
      )
      .finally => @saving = false
    else
      params.sections = @selectedEntities
      @Restangular.all('sections').one('move').patch(params).then ((response)=>
        @close({'convert':true})
      ),((error) =>
        if error.status == @ERROR_CODES.BAD_REQUEST
          message = 'Refresh'
        else
          message = "Okay"
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: message
        }).then (isConfirm) =>
          if isConfirm and error.status == @ERROR_CODES.BAD_REQUEST
            @$state.go("app.diligence.template.preview",{templateId: @templateId})
          @close() if isConfirm
      )
      .finally => @saving = false

  selectSection: (section)=>
    #If the selected section is not the previously selected section, then the set the selected attribute to false
    #this logic is for selecting only one section at a time.
    if @selectedEntity and @selectedEntity != section
      @selectedEntity.selected = false
    @selectedEntity = section

  convertToCategory: =>
    @moving = true
    params = {
      template_id: Number(@templateId)
      template_version: @templateVersion
      sections: @selectedEntities
    }
    @Restangular.all('sections').one('make_parent_sections').patch(params).then ((response)=>
      @close({'convert':true})
    ),((error) =>
      if error.status == @ERROR_CODES.BAD_REQUEST
        message = 'Refresh'
      else
        message = "Okay"
      @SweetAlert.error({
        title: error.data.message
        confirmButtonText: message
      }).then (isConfirm) =>
        if isConfirm and error.status == @ERROR_CODES.BAD_REQUEST
          @$state.go("app.diligence.template.preview",{templateId: @templateId})
        @close() if isConfirm
    )
    .finally => @moving = false