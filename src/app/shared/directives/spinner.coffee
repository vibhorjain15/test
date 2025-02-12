angular.module('diligenceVault').directive 'spinner', ->
  restrict: 'E'
  replace: true
  template: (element, attrs) ->
    size_class = ''
    margin_class = ''
    loading_text = ''

    if attrs.size
      size_class = "fa-#{attrs.size}"

    if attrs.spinnerText
      loading_text = attrs.spinnerText
      margin_class = 'space-on-right-lg'

    tpl = "<span><i class=\"dvi dvi-spinner fa-spin #{size_class} #{margin_class}\"></i>#{loading_text}</span>"

    if angular.isDefined(attrs.includePanel)
      """
      <div class="panel panel-default">
        <div class="panel-body">
          #{tpl}
        </div>
      </div>
      """
    else if angular.isDefined(attrs.broadSpinner)
      height = Number(attrs.spinnerHeight) || 240
      """
      <div>
        <table class="table clear-margin-bottom">
              <tbody>
                  <tr style="height:#{height}px">
                      <td class="text-center borderless align-middle">
                         #{tpl}
                      </td>
                  </tr>
              </tbody>
        </table>
      </div>
      """
    else
      tpl
