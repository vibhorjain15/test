angular.module('diligenceVault').directive 'subsetSelect', ->
  restrict: 'E'
  scope: true
  template: (element, attrs) ->
    """
      <div class="subset-select">
        <div class="panel panel-default md-panel master-list">
          <div class="panel-heading">
            <h5 class="panel-title">#{attrs.listTitle}</h5>
          </div>

          <div class="list-group">
            <div class="list-group-item"
                 data-ng-click="toggleSelection(entity)"
                 data-ng-class="{'active': entity.is_selected}"
                 data-ng-repeat="entity in #{attrs.list}|orderBy:'#{attrs.labelProperty}'">
              {{entity.#{attrs.labelProperty}}}
            </div>
          </div>
        </div>

        <div class="list-controls">
          <button type="button" data-ng-click="addSelection()">
            <icon name="arrow-right"></icon>
          </button>

          <button type="button" data-ng-click="removeSelection()">
            <icon name="arrow-left"></icon>
          </button>
        </div>

        <div class="panel panel-default md-panel sub-list">
          <div class="panel-heading">
            <h5 class="panel-title">#{attrs.subListTitle}</h5>
          </div>

          <div class="panel-body" data-ng-hide="selection_list.length">
            <empty-state message="No selection made"></empty-state>
          </div>

          <div class="list-group" data-ng-show="selection_list.length">
            <div class="list-group-item"
                 data-ng-click="toggleSelection(entity)"
                 data-ng-class="{'active': entity.is_selected}"
                 data-ng-repeat="entity in selection_list">
              {{entity.#{attrs.labelProperty}}}
            </div>
          </div>
        </div>
      </div>
    """

  controller: ($scope, $attrs) ->
    list = $scope.$eval($attrs.list)
    selection_list = []

    transferSelectedItems = (source, dest) ->
      selection = _(source).where(is_selected: true)

      angular.forEach selection, (item) ->
        dest.push item
        source.splice source.indexOf(item), 1
        item.is_selected = null

    $scope.selection_list = selection_list

    $scope.addSelection = ->
      transferSelectedItems(list, selection_list)

    $scope.removeSelection = ->
      transferSelectedItems(selection_list, list)

    $scope.toggleSelection = (entity) ->
      entity.is_selected = !entity.is_selected

    return
