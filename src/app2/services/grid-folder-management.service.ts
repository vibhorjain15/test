import { HttpClient, HttpContext } from '@angular/common/http';
import { ElementRef, Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable } from 'rxjs';
import { ICellRendererParams } from 'ag-grid-community';
import { SweetAlertService } from './sweet-alert.service';
import { SKIP_400_ALERT } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class GridFolderManagementService {
  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  getAttachmentHierarchy(
    folderId = 0,
    type = null,
    entityId = null,
    entityType = null,
    startDate = null,
    endDate = null
  ) {
    return this.http.get(
      `v2/attachments?folder_id=${folderId}&type=${type}&entity_id=${entityId}&entity_type=${entityType}
      &start_date=${startDate}&end_date=${endDate}`
    );
  }

  prepareAttachmentHierarchyV2(attachmentHierarchy, attachments, gridType) {
    let parentFolderToChildMapping = {};
    let attachmentHierarchyIdToNodeMapping = {};
    attachmentHierarchy?.forEach((item) => {
      attachmentHierarchyIdToNodeMapping[item.id] = item;
      if (item.parent_id in parentFolderToChildMapping) {
        parentFolderToChildMapping[item.parent_id].childNodes.push(item);
      } else {
        parentFolderToChildMapping[item.parent_id] = {
          childNodes: [item],
        };
      }
    });

    let attachmentIdToAttachmentMapping = {};
    attachments?.forEach((attachment) => {
      // in content grid, we use attachments endpoint where id => attachment id.
      // but in entity grid, we use attachmentAssignments endpoint where attachment_id is a separate property.
      attachmentIdToAttachmentMapping[
        attachment.attachment_id ?? attachment.id
      ] = {
        attachment,
        isAdded: false,
      };
    });

    let traversalNodes = parentFolderToChildMapping['null']?.childNodes ?? [];
    let result = [];

    while (traversalNodes.length > 0) {
      let childNodes = [];
      traversalNodes.forEach((node) => {
        let folderPathString =
          node.parent_id == null
            ? ''
            : attachmentHierarchyIdToNodeMapping[node.parent_id]
                .folderPathString;
        let parentAttachmentHierarchyPath =
          node.parent_id == null
            ? []
            : [...attachmentHierarchyIdToNodeMapping[node.parent_id].path];
        if (node.attachment_id) {
          let attachment =
            attachmentIdToAttachmentMapping[node.attachment_id]?.attachment;
          if (attachment) {
            attachment = {
              ...attachment,
              path: [...parentAttachmentHierarchyPath, node.id],
              type: 1,
              attachmentHierarchyId: node.id,
              parentAttachmentHierarchyId: node.parent_id,
              folderPath: folderPathString,
            };
            if (!attachmentIdToAttachmentMapping[node.attachment_id].isAdded) {
              attachmentIdToAttachmentMapping[node.attachment_id].isAdded =
                true;
              result.push(attachment);
            }
          }
        } else {
          result.push({
            ...node,
            path: [...parentAttachmentHierarchyPath, node.id],
            name: node.name,
            type: 0,
            attachmentHierarchyId: node.id,
            parentAttachmentHierarchyId: node.parent_id,
            folderPath: folderPathString,
          });
          attachmentHierarchyIdToNodeMapping[node.id].folderPathString =
            !folderPathString?.length
              ? node.name
              : folderPathString + ' > ' + node.name;
          attachmentHierarchyIdToNodeMapping[node.id].path = [
            ...parentAttachmentHierarchyPath,
            node.id,
          ];
          if (parentFolderToChildMapping[node.id]?.childNodes?.length) {
            childNodes.push(...parentFolderToChildMapping[node.id].childNodes);
          }
        }
      });
      traversalNodes = childNodes;
    }

    Object.values(attachmentIdToAttachmentMapping)
      .filter((item: any) => !item.isAdded)
      .forEach((item: any) => {
        result.push({
          ...item.attachment,
          path: [Math.random()],
          type: 1,
          attachmentHierarchyId: null,
          parentAttachmentHierarchyId: null,
          folderPath: '',
        });
      });

    return [result, null];
  }

  /*  Logic to form path management */
  prepareAttachmentHierarchy(
    attachmentHierarchy,
    attachments,
    gridType
  ): any[] {
    let rootEntries = attachmentHierarchy.filter(
      (item) => item.parent_id == null
    );
    let result = [];
    if (rootEntries?.length) {
      result.push(
        ...this.traverseAttachmentHierarchy(
          null,
          [],
          attachmentHierarchy,
          attachments,
          gridType
        )
      );

      // attachments without attachment hierarchy entry should be added at the root level
      var attachmentsWithoutHierarchyEntry = attachments.filter(
        (attachment) => !result.some((item) => item.id == attachment.id)
      );
      if (attachmentsWithoutHierarchyEntry?.length) {
        result.push(
          ...attachmentsWithoutHierarchyEntry.map((attachment) => {
            return {
              ...attachment,
              path: [Math.random()],
              type: 1,
              attachmentHierarchyId: null,
              parentAttachmentHierarchyId: null,
              folderPath: '',
            };
          })
        );
      }
      return [result, null];
    }

    return [
      attachments.map((attachment) => {
        return {
          ...attachment,
          type: 1,
          folderPath: '',
        };
      }),
      null,
    ];
  }

  /*  Logic to form path management */
  traverseAttachmentHierarchy(
    folderId,
    path,
    attachmentHierarchy,
    attachments,
    gridType,
    parentFolderPathString = null
  ) {
    let items = attachmentHierarchy.filter(
      (item) => item.parent_id == folderId
    );
    let result = [];
    items.forEach((item) => {
      if (item.attachment_id) {
        let attachment = attachments.find(
          (document) =>
            (gridType === 'content' ? document.id : document.attachment_id) ==
            item.attachment_id
        );
        if (attachment) {
          attachment = {
            ...attachment,
            path: [...path, item.id],
            type: 1,
            attachmentHierarchyId: item.id,
            parentAttachmentHierarchyId: item.parent_id,
            folderPath: parentFolderPathString ?? '',
          };
          result.push(attachment);
        }
      } else {
        result.push({
          ...item,
          path: [...path, item.id],
          name: item.name,
          type: 0,
          attachmentHierarchyId: item.id,
          parentAttachmentHierarchyId: item.parent_id,
          folderPath: parentFolderPathString ?? '',
        });
        let nextFolderPathString = !parentFolderPathString?.length
          ? item.name
          : parentFolderPathString + ' > ' + item.name;
        let childEntries = this.traverseAttachmentHierarchy(
          item.id,
          [...path, item.id],
          attachmentHierarchy,
          attachments,
          gridType,
          nextFolderPathString
        );
        if (childEntries.length) {
          result.push(...childEntries);
        }
      }
    });
    return result;
  }

  /**
   * Update document in bulk
   * @param payload It should contain only the properties that needs to be updated.
   * @usageNotes
   * ```
   * const payload = {
   *  as_of_date: '2024-03-04',
   *  associated_entities: [
   *    { id: 1234, entity_type: 'Strategy' }
   *  ],
   *  attachment_ids: [2321, 3233],
   *  tags: [12, 13]
   * }
   * ```
   */
  updateDocuments(payload: any): Observable<any> {
    return this.http.post('v2/attachments/update_multiple', payload);
  }

  /*  Logic to perform folder actions  */
  createNewFolder(payload, skipBadRequestAlert = false) {
    return this.http.post('document_folders', payload, {
      context: new HttpContext().set(SKIP_400_ALERT, skipBadRequestAlert),
    });
  }

  renameFolder(id, folderName, skipBadRequestAlert = false) {
    return this.http.put(
      `document_folders/${id}`,
      {
        name: folderName,
      },
      {
        context: new HttpContext().set(SKIP_400_ALERT, skipBadRequestAlert),
      }
    );
  }

  pasteDocument(payload: any, skipBadRequestAlert = false): Observable<any> {
    return this.http.post('document_folders/paste', payload, {
      context: new HttpContext().set(SKIP_400_ALERT, skipBadRequestAlert),
    });
  }

  paste = async (params, isCut = false, gridClipboardData, callback) => {
    const payload = {
      Destination_attachment_hierarchy_id:
        this.getDestinationAttachmentHierarchyId(params),
      Root_attachment_hierarchy_ids:
        this.getRootAttachmentHierarchyIds(gridClipboardData),
      Is_cut: isCut,
    };
    const res: any[] = (await this.pasteDocument(payload).toPromise()) as any;
    callback();
  };

  isFolderNameValid(folderName: string): { isValid: boolean; reason?: string } {
    // Remove any leading or trailing whitespace
    folderName = folderName.trim();

    // Check if folder name is empty
    if (folderName.length === 0) {
      return { isValid: false, reason: 'Folder name cannot be empty.' };
    }

    // Check if folder name contains any invalid characters
    if (/[<>:"\/\\|?*]/.test(folderName)) {
      return {
        isValid: false,
        reason: 'Folder name contains invalid characters (< > : " / \\ | ? *).',
      };
    }

    // Check if folder name ends with a space or dot
    if (/\s$|\.$/.test(folderName)) {
      return {
        isValid: false,
        reason: 'Folder name cannot end with a space or dot.',
      };
    }
    // Check for pre-defined windows name
    if (
      !/^(?!((com[0-9]|con|lpt[0-9]|nul|prn|aux)\b|[\s.=\+\-\@]))[^\\\/:*"?<>|]{1,254}$/i.test(
        folderName
      )
    ) {
      return {
        isValid: false,
        reason: 'Please enter a valid folder name',
      };
    }
    return { isValid: true };
  }

  getDestinationAttachmentHierarchyId(
    params: ICellRendererParams
  ): number | null {
    return params?.node?.data?.document?.type === 0
      ? params?.node?.data?.document?.attachmentHierarchyId
      : params?.node?.data?.document?.path?.length > 1
      ? params?.node?.data?.document?.path[
          params?.node?.data?.document?.path.length - 2
        ]
      : null;
  }

  getRootAttachmentHierarchyIds(gridClipboardData): Array<number> {
    return gridClipboardData
      .filter(
        (item) =>
          item.attachmentHierarchyId != null &&
          (item.parentAttachmentHierarchyId == null ||
            !gridClipboardData.some(
              (item2) =>
                item2.attachmentHierarchyId == item.parentAttachmentHierarchyId
            ))
      )
      .map((data) => data.attachmentHierarchyId);
  }

  // This function will take in [112,34,545] as path and return response document names
  getCurrentFolderPath(documents, path, defaultPath = ['Documents']) {
    let selectedPathNames = [];
    const filteredDocuments = documents.filter((document) =>
      path.includes(document.id)
    );
    selectedPathNames = [...defaultPath];
    path.forEach((id) => {
      const pathName = filteredDocuments.find((document) => document.id === id)
        ?.document?.name;
      if (pathName) {
        selectedPathNames.push(pathName);
      }
    });

    return selectedPathNames;
  }

  getTextToRenderOnOverflow(
    elementRef: ElementRef<HTMLInputElement>,
    textContent: string
  ): string {
    if (!elementRef || !textContent) {
      return textContent;
    }

    const el = elementRef.nativeElement;
    const window = this.document.defaultView;
    const computedStyle = window.getComputedStyle(el);

    const canvas = this.document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = computedStyle.font;
    const contentWidth =
      el.clientWidth -
      parseFloat(computedStyle.paddingLeft) -
      parseFloat(computedStyle.paddingRight);

    let _folderPath = '';
    let textOverflowed = false;
    for (let charIndex = textContent.length - 1; charIndex >= 0; charIndex--) {
      _folderPath = textContent.charAt(charIndex) + _folderPath;
      const textWidth = context.measureText(_folderPath).width;
      if (textWidth > contentWidth) {
        textOverflowed = true;
        break;
      }
    }

    if (textOverflowed) {
      textContent = '...' + _folderPath.substring(5);
    }

    return textContent;
  }
}
