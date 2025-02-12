/*
  This method takes the response content and attempts to copy it to clipboard.
  The content is copied using both html and plaintext mime types
  .
  Html mime type is used to allow html content like image, formatted text etc to be pasted as it is in contentEditable divs (eg: tinymce editor)
  Reference: https://www.stefanjudis.com/notes/a-clipboard-magic-trick-how-to-use-different-mime-types-with-the-clipboard/
  
  Plain text content obtained from span does not contain html tags. it prevents html tags from showing up when content is pasted in non-html text area or inputs.

  In case of errors in the above, the method defaults to ngx-clipboard to copy plain text.
  */
export const copyHtml = (content, clipboard, toaster) => {
  var extractedText = content
    ?.replace(/<br>/g, '\n')
    ?.replace(/<\/br>/g, '\n')
    ?.replace(/<br\/>/g, '\n')
    ?.replace(/<br \/>/g, '\n');

  if (isFirfoxBrowser()?.length) {
    writeToClipboard(content, clipboard, toaster);
  } else {
    try {
      let span = document.createElement('span');
      span.innerHTML = content;
      extractedText = span.textContent || span.innerText;
      span.remove();
    } catch (err) {}
    try {
      const htmlContent = new Blob([content], { type: 'text/html' });
      const textContent = new Blob([extractedText], { type: 'text/plain' });
      const clipboardItemInput = new ClipboardItem({
        'text/html': htmlContent,
        'text/plain': textContent,
      });
      navigator.clipboard.write([clipboardItemInput]);
      toaster.success('', 'Response copied to clipboard');
    } catch (e) {
      try {
        clipboard.copyFromContent(extractedText);
        toaster.success('', 'Response copied to clipboard');
      } catch (e) {
        toaster.error('', 'Unable to copy content to clipboard');
      }
    }
  }
};

const isFirfoxBrowser = () => {
  let userAgent = navigator.userAgent;
  return userAgent.match(/firefox|fxios/i);
};

function writeToClipboard(text, clipboard, toaster) {
  // Create a new DOMParser instance
  const parser = new DOMParser();

  // Parse the input text as HTML using the DOMParser
  const html = parser.parseFromString(text, 'text/html');

  // Create a <span> element to hold the parsed HTML content
  let span = document.createElement('span');
  span.innerHTML = html.body.innerHTML;
  let extractedText = span.textContent || span.innerText;
  document.body.appendChild(span);

  // Create a Range to select the contents of the <span> element
  let range = document.createRange();
  range.selectNodeContents(span);

  // Get the current selection and add the created Range to it
  let selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    // Execute the copy command using document.execCommand('copy')
    let successful = document.execCommand('copy');
    let msg = 'Response copied to clipboard!';
    if (!successful) clipboard.copyFromContent(extractedText);
    toaster.success('', msg);
  } catch (err) {
    try {
      clipboard.copyFromContent(extractedText);
      toaster.success('', 'Response copied to clipboard');
    } catch (e) {
      toaster.error('', 'Unable to copy content to clipboard');
    }
  }

  // Clean up by removing the temporary <span> element
  document.body.removeChild(span);
}
