angular.module('diligenceVault').filter 'plaintext', ->
  (text) ->
    if text
      decodeHTMLEntities = (str) ->
        element = document.createElement('div')
        if str and typeof str == 'string'
          # strip script/html tags
          str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '')
          str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '')
          element.innerHTML = str
          str = element.textContent
          element.textContent = ''
        str
      text = decodeHTMLEntities(text)

    else ''
