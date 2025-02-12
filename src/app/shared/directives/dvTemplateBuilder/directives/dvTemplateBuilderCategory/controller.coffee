class DVTemplateBuilderCategoryController extends BaseController
  @register 'DVTemplateBuilderCategoryController'

  @inject '$attrs', '$scope', 'TemplatesDataService', 'toaster',
          'SweetAlert'

  initialize: ->
    @category = @$scope.$parent.$eval(@$attrs.category)
    @category.templateID ||= 117

    @getSubcategories()
    @watchForEvents()

  addNewSubcategory: ->
    params =
      templateID: @category.templateID
      name: "Untitled Subsection"
      parentID: @category.id

    @adding_subcategory = true
    @TemplatesDataService.createSection(params).then((response) =>
      @category.subcategories.push(response)
    ).finally(=> @adding_subcategory = false)

  getSubcategories: ->
    @TemplatesDataService.getSections(@category.templateID ,{
      parentID: @category.id
    }).then (response) =>
      @category.subcategories = response

      unless response.length
        @addNewSubcategory()

  moveUp: (category, idx) ->
    @$scope.$emit 'move_up:category', category, idx

  moveDown: (category, idx) ->
    @$scope.$emit 'move_down:category', category, idx

  saveCategory: ->
    @TemplatesDataService.updateSection(@category.id, {
      name: @category.name
    }).then =>
      @toaster.pop 'success', '', 'Updated section name'

  confirmSectionRemoval: ->
    @SweetAlert.confirm({
      title: "Are you sure you want to delete \"#{@category.name}\" ?"
      confirmButtonText: 'Yes, delete it!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @TemplatesDataService.removeSection(@category.id).then =>
          @$scope.$emit 'remove:category', @category
        .finally =>  swal.close()
    })  

  watchForEvents: ->
    category = @category

    @$scope.$on 'move_up:subcategory', (event, subcategory, idx) =>
      @$scope.$emit('move_up:item', category.subcategories, subcategory, idx)

    @$scope.$on 'move_down:subcategory', (event, subcategory, idx) =>
      @$scope.$emit('move_down:item', category.subcategories, subcategory, idx)

    @$scope.$on 'remove:subcategory', (event, subcategory) =>
      subcategories = @category.subcategories

      subcategories.splice(subcategories.indexOf(subcategory), 1)
