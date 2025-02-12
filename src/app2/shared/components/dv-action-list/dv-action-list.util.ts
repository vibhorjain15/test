type Dimensions = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  height?: number;
  width?: number;
};

// Returns position offset relative to the container.
//
// Measures the number of pixels from the top of the container to the
// top of the element and the number of pixels from the bottom of the
// containers full scroll height to the bottom of the element. If
// container is `body`, this is the same as $(element).offset().
//
//     +---------------------+ -|
//     |  outside | viewport |  |
//     +----------|----------+  |
//     |          |          |  |
//     |    top > |          |  |
//     |          |          |  | h
//     |          |          |  | e
//     |  v left  V right v  |  | i
//     |-----> Element <-----|  | g
//     |          ^          |  | h
//     |          |          |  | t
//     | bottom > |          |  |
//     |          |          |  |
//     +----------|----------+  |
//     |  outside | viewport |  |
//     +---------------------+ -|
//
//   {top: 100, left: 100, bottom: 800, right: 800}.
//
// Get element positioned offset.
//
// This value is useful for assigning to `scrollTop` to scroll to the item.
export function positionedOffset(
  targetElement: HTMLElement,
  container: HTMLElement | Document | Window | null
): (Dimensions & { _container: HTMLElement }) | undefined {
  let element = targetElement;
  const document = element.ownerDocument;
  if (!document) {
    return;
  }

  const documentElement = document.documentElement;
  if (!documentElement) {
    return;
  }

  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const HTMLElement = document.defaultView.HTMLElement;

  let top = 0;
  let left = 0;
  const height = element.offsetHeight;
  const width = element.offsetWidth;

  while (!(element === document.body || element === container)) {
    top += element.offsetTop || 0;
    left += element.offsetLeft || 0;

    if (element.offsetParent instanceof HTMLElement) {
      element = element.offsetParent!;
    } else {
      return;
    }
  }

  let scrollHeight;
  let scrollWidth;
  let measuredContainer: HTMLElement;

  if (
    !container ||
    container === document ||
    container === document.defaultView ||
    container === document.documentElement ||
    container === document.body
  ) {
    measuredContainer = documentElement;
    scrollHeight = getDocumentHeight(document.body, documentElement);
    scrollWidth = getDocumentWidth(document.body, documentElement);
  } else if (container instanceof HTMLElement) {
    measuredContainer = container;
    scrollHeight = container.scrollHeight;
    scrollWidth = container.scrollWidth;
  } else {
    return;
  }

  const bottom = scrollHeight - (top + height);
  const right = scrollWidth - (left + width);
  return { top, left, bottom, right, _container: measuredContainer };
}

function getDocumentHeight(
  documentBody: HTMLElement,
  documentElement: HTMLElement
): number {
  return Math.max(
    documentBody.scrollHeight,
    documentElement.scrollHeight,
    documentBody.offsetHeight,
    documentElement.offsetHeight,
    documentElement.clientHeight
  );
}

function getDocumentWidth(
  documentBody: HTMLElement,
  documentElement: HTMLElement
): number {
  return Math.max(
    documentBody.scrollWidth,
    documentElement.scrollWidth,
    documentBody.offsetWidth,
    documentElement.offsetWidth,
    documentElement.clientWidth
  );
}
