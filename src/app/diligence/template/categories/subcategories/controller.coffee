class DiligenceTemplateSubcategoriesController extends BaseController
  @register 'DiligenceTemplateSubcategoriesController'

  @inject '$state', 'Restangular', '$stateParams', 'SweetAlert', 'TemplatesDataService', 'ModalFactory',
          'toaster','ERROR_CODES', '$scope', '$timeout', 'Utils', '$rootScope','angularTemplateEnabled'

  initialize: ->
    @templateId = @$stateParams.templateId
    @parentID = @$stateParams.categoryId
    @parentCategoryObj = {}
    @subcategories = []
    @selectedEntities = []
    @moveEnabled = false
    @loading = true

    if @parentID
      @Restangular
        .one('templates', @templateId)
        .all('sections')
        .getList({isParent: true})
        .then (response) =>
          @categories = response
          @parentCategoryObj = _.findWhere(@categories, {id: parseInt(@parentID)})

      @Restangular
        .one('templates', @templateId)
        .all('sections')
        .getList({parentID: @parentID})
        .then ((response) =>
          @subcategories = response

          #go to first sub category only if subcategory id is not passed in the url
          unless @$state.params.subcategoryId?
            @goToSubcategory(@subcategories[0])
          @loading = false
        ),(error) =>
          @loading = false
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (confirm) =>
              if confirm.value and confirm.value == true
                @$state.go("app.diligence.template.preview",{templateId: @templateId})
          else if error.data and error.data.message != ""
            @toaster.pop 'error', '', error.data.message


  goToSubcategory: (subcategory) =>
    if subcategory and subcategory.id
      @$timeout =>
        @$state.go('app.diligence.template.categories.subcategories.questions', {
          categoryId: @$stateParams.categoryId
          subcategoryId: subcategory.id
        })

  openAddSubCategoryDialog: ->
    parentName = ""
    if @parentCategoryObj
      parentName  = @parentCategoryObj.name
    @ModalFactory.invokeModal 'add_template_category',
      resolve:
        section: =>
        addingSubcategory: => true
        parentName: => parentName
        existingCategories: =>  @subcategories
      success: (response) =>
        if response
          @$rootScope.$emit 'refresh:template'
          @subcategories = @subcategories.concat response
          if response.length
            @goToSubcategory(response[0])
          else
            @goToSubcategory(response)

  getSubCategories: =>
    @Restangular
      .one('templates', @templateId)
      .all('sections')
      .getList({parentID: @parentID})
      .then (response) =>
        @subcategories = response
        @goToSubcategory(@subcategories[0])

  openEditSubCategoryDialog: (subcategory,index) ->
    parentName = ""
    if @parentCategoryObj
      parentName  = @parentCategoryObj.name
    @ModalFactory.invokeModal 'add_template_category',
      resolve:
        section: -> angular.copy subcategory
        addingSubcategory: -> true
        parentName: => parentName
        existingCategories: =>  false
      success: (response) =>
        if response
          @$rootScope.$emit 'refresh:template'
          @subcategories[index] = response

  removeCategory: (subcategory) ->
    return if @subcategories.length is 1
    @SweetAlert.confirm({
      title: "Are you sure you want to delete \"#{subcategory.name}\" ?"
      confirmButtonText: 'Yes, delete it!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @TemplatesDataService.removeSection(subcategory.id).then (=>
          @toaster.pop 'success', '', "Subcategory deleted successfully"
          @$rootScope.$emit 'refresh:template'
          @subcategories.splice(@subcategories.indexOf(subcategory), 1)

          @$state.go('app.diligence.template.categories.subcategories')
        ),(error) =>
          swal.close()
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (confirm) =>
              if confirm.value and confirm.value == true
                @$state.go("app.diligence.template.preview",{templateId: @templateId})
          else if error.data and error.data.message != ""
            @toaster.pop 'error', '', error.data.message
    })

  moveSubcategory: () ->
    if @selectedEntities.length > 0
      @ModalFactory.invokeModal 'move_question',
        resolve:
          selectedEntities: => @selectedEntities
          templateId: => @$stateParams.templateId
          entityId: => @$stateParams.categoryId
          entityType: => 'subcategories'
          templateVersion: => @$scope.template_version
          soureSectionId: => @$stateParams.categoryId
        success: (response)=>
          if response.convert
            @$scope.$parent.vm.getCategories()
          @getSubCategories()
          @$rootScope.$emit 'refresh:template'
          @selectedEntities = []
          @moveEnabled = false
          @$state.go('app.diligence.template.categories.subcategories', {
            categoryId: @$stateParams.categoryId
          })

      # modalInstance.result.then (response) =>
      #   @getSubCategories() if response?.reload
      # , (response) =>
      #   @getSubCategories() if response?.reload

  toggleMoveMode: =>
    @moveEnabled = !@moveEnabled

  selectSubcategory: (subcategory)=>
    if subcategory.selected
      @selectedEntities.push subcategory
    else
      index = @selectedEntities.indexOf subcategory
      @selectedEntities.splice index, 1

    @selectedAllSubcategories = false
    if @selectedEntities.length == @subcategories.length
      @selectedAllSubcategories = true

  onSelectAllSubcategories : ()=>
    @selectedEntities = []
    _(@subcategories).each (subcategory)=>
      subcategory.selected = @selectedAllSubcategories
      @selectedEntities.push subcategory if @selectedAllSubcategories


  getQuestions: (subcategory)=>
    if not @moveEnabled
      @$state.go 'app.diligence.template.categories.subcategories.questions',{subcategoryId: subcategory.id}
