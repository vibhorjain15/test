angular.module('diligenceVault').filter 'entitiesWithContactTag', ->
  (items, tagId) ->
    if !tagId
      _(items).each (item, i) ->
        i = 0
        total_recipients_count = 0
        if item.notification_contacts
          while i < item.notification_contacts.length
            if !item.notification_contacts[i].is_removed
              total_recipients_count += 1
            i++
        item.total_recipients_count = total_recipients_count
      return items
    else
      filtered = []
      _(items).each (item, i) ->
        if item.notification_contacts.length
          i = 0
          has_contact_tag = false
          total_recipients_count = 0
          if item.notification_contacts
            while i < item.notification_contacts.length
              if item.notification_contacts[i].tag_ids.indexOf(tagId) > -1
                if !item.notification_contacts[i].is_removed
                  total_recipients_count += 1
                has_contact_tag = true
              i++
          if has_contact_tag
            item.total_recipients_count = total_recipients_count
            filtered.push item
      return filtered
