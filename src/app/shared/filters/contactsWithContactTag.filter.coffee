angular.module('diligenceVault').filter 'contactsWithContactTag', ->
  (items, tagId) ->
    if !tagId
      return items
    else
      filtered = []
      _(items).each (item, i) ->
        if item.tag_ids.indexOf(tagId) > -1
          filtered.push item
      return filtered
