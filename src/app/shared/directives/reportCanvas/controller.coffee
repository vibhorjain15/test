###
Pseudo code for tomorrow

Each component has something called attributes which let's you customize
that particular component. This might be the case of $modelValue being
different from $viewValue

Clicking each component should trigger onClick back to report builder
which based on component renders the component control panel which on
changing values would update attributes which in turn would update the
$viewValue aka the rendering
###
class ReportCanvasController extends BaseController
  @register 'ReportCanvasController'
  @inject '$scope', '$attrs'

  setPages: (pages) ->
    @pages = pages

  setComponents: (components) ->
    @components = components

  setCurrentPage: (page) ->
    @current_page = page

  insertComponent: (component_type, idx) ->
    @current_page.insertComponent(component_type, idx)
