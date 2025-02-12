class DiligenceTemplateCategoriesController extends BaseController
  @register 'DiligenceTemplateCategoriesController'

  @inject '$state', '$scope', '$stateParams', 'Restangular', 'ModalFactory', 'SweetAlert', 'TemplatesDataService',
          'toaster', 'Utils', 'LayoutUtils', '$timeout','ERROR_CODES', '$rootScope','angularTemplateEnabled'

  initialize: ->
    @templateId = parseInt(@$stateParams.templateId)
    @categoryId = parseInt(@$state.params.categoryId)
    @loading = false
    @getCategories()

    @$scope.sortableOptions =
      axis: 'y'
      handle: '.sort-handle'
      cursor: 'move'
      placeholder: 'sortable-placeholder'

    @category_chardin_config =
      scroll_to_target: true
      intros: [
        {
          target: '.js-add-category'
          intro: 'Add a new category'
          position: 'top'
        }
        {
          target: ".js-sort-handle:first",
          intro: 'Use this to reorder categories'
          position: 'bottom'
        }
        {
          target: '.js-edit-category:first'
          intro: 'Edit Category'
          position: 'right'
        }
        {
          target: '.js-delete-category:first'
          intro: 'Delete Category'
          position: 'bottom'
        }
      ]

  openAddCategoryDialog: =>
    @ModalFactory.invokeModal 'add_template_category',
      resolve:
        section: =>
        addingSubcategory: => false
        parentName: => false
        existingCategories: =>  @categories
      success: (newCategories) =>
        if newCategories
          @$rootScope.$emit 'refresh:template'
          @categories = @categories.concat newCategories
          if newCategories.length
            @goToCategory(newCategories[0])
          else
            @goToCategory(newCategories)


  goToSelectedCategory: (category) ->
    passedId = parseInt(category.id)
    currentCategory = parseInt(@$state.params.categoryId)
    if currentCategory != passedId
      @$state.go 'app.diligence.template.categories.subcategories', {categoryId: passedId}

  getCategories: () =>
    @loading = true
    @Restangular.one('templates', @templateId).all('sections').getList({isParent: true}).then ((response) =>
      @categories = response
      #goto first category only if category id is not passed in the url.
      if !@categoryId or Number.isNaN(@categoryId)
        @goToCategory(@categories[0])
      if @$stateParams.addNew
        @openAddCategoryDialog()
      @displayTutorialForFirstTimeUser()
      @loading = false
    ), (error) =>
      @loading = false


  goToCategory: (category) =>
    if category and category.id
      @$timeout =>
        @$state.go('app.diligence.template.categories.subcategories', {
          categoryId: category.id
        })


  displayTutorialForFirstTimeUser: ->
    if @Utils.isFirstTemplate()
      @$timeout =>
        @LayoutUtils.triggerHelp()

  openEditCategoryDialog: (category,index) ->
    @ModalFactory.invokeModal 'add_template_category',
      resolve:
        section: => angular.copy category
        parentName: => false
        addingSubcategory: => false
        existingCategories: => false
      success: (response) =>
        if response
          @$rootScope.$emit 'refresh:template'
          @categories[index] = response

  removeCategory: (category) ->
    return if @categories.length is 1
    @SweetAlert.confirm({
      title: "Are you sure you want to delete \"#{category.name}\" ?"
      confirmButtonText: 'Yes, delete it!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @TemplatesDataService.removeSection(category.id).then (=>
          @toaster.pop 'success', '', "Category deleted successfully"
          @$rootScope.$emit 'refresh:template'
          @categories.splice(@categories.indexOf(category), 1)

          @$state.go 'app.diligence.template.categories'
        ),(error) =>
          swal.close()
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (confirm) =>
              if confirm.value and confirm.value== true
                @$state.go("app.diligence.template.preview",{templateId: @templateId})
          else if error.data and error.data.message != ""
            @toaster.pop 'error', '', error.data.message
    })
