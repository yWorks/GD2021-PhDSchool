/**
 * @license
 * This app exhibits yFiles for HTML functionalities.
 * Copyright (c) 2021 by yWorks GmbH, Vor dem Kreuzberg 28,
 * 72070 Tuebingen, Germany. All rights reserved.
 *
 * yFiles demo files exhibit yFiles for HTML functionalities.
 * Any redistribution of demo files in source code or binary form, with
 * or without modification, is not permitted.
 *
 * Owners of a valid software license for a yFiles for HTML
 * version are allowed to use the app source code as basis for their
 * own yFiles for HTML powered applications. Use of such programs is
 * governed by the rights and conditions as set out in the yFiles for HTML
 * license agreement. If in doubt, please mail to contact@yworks.com.
 *
 * THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 * NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { detectiOSVersion } from './Workarounds'

export class FileIoSupport {
  /**
   * Opens a file through a file picker dialog. Returned promise does not always fulfill, as there is no way to tell if
   * the user canceled the file picker dialog.
   */
  static openFile(accept: string): Promise<File> {
    const inputElement = document.createElement('input')
    inputElement.setAttribute('type', 'file')
    if (detectiOSVersion() === -1) {
      inputElement.setAttribute('accept', accept) // accept doesn't work on iOS devices
    }
    return new Promise((resolve, reject) => {
      inputElement.addEventListener('change', (e) => {
        // @ts-ignore
        const file = e.target.files[0]
        if (!file) {
          return reject(new Error('Could not open file'))
        }
        const format = FileIoSupport.getFileExtension(file)
        if (typeof format === 'string' && accept.indexOf(format) === -1) {
          reject(
            new Error(
              `Unsupported file format! Tried to open file of type: ${format}`
            )
          )
        }
        resolve(file)
      })
      document.body.appendChild(inputElement)
      inputElement.click()
      setTimeout(() => {
        document.body.removeChild(inputElement)
      }, 200)
    })
  }

  /**
   * Saves the file to the file system using the HTML5 File download or
   * the proprietary msSaveOrOpenBlob function in Internet Explorer.
   * @param fileContent The file contents to be saved.
   * @param fileName The default filename for the downloaded file.
   */
  static saveToFile(fileContent: string, fileName: string) {
    return new Promise((resolve, reject) => {
      // extract file format
      const split = fileName.split('.')
      const fileExtension = split[split.length - 1]
      const format = fileExtension.toLowerCase()

      if (FileIoSupport.isFileConstructorAvailable()) {
        if (
          format === 'txt' ||
          format === 'svg' ||
          format === 'graphml' ||
          format === 'pdf' ||
          format === 'png' ||
          format === 'json'
        ) {
          let mimeType = ''
          switch (format) {
            case 'png':
              mimeType = 'image/png'
              break
            case 'pdf':
              mimeType = 'text/plain; charset=x-user-defined'
              break
            case 'txt':
            default:
              mimeType = 'text/plain'
              break
            case 'svg':
              mimeType = 'image/svg+xml'
              break
            case 'graphml':
              mimeType = 'application/xml'
              break
            case 'json':
              mimeType = 'application/json'
              break
          }

          let blob = null
          if (format === 'pdf') {
            // encode content to make transparent images work correctly
            const uint8Array = new Uint8Array(fileContent.length)
            for (let i = 0; i < fileContent.length; i++) {
              uint8Array[i] = fileContent.charCodeAt(i)
            }
            blob = new Blob([uint8Array], { type: mimeType })
          } else if (format === 'png') {
            // save as binary data
            const dataUrlParts = fileContent.split(',')
            const bString = window.atob(dataUrlParts[1])
            const byteArray = []
            for (let i = 0; i < bString.length; i++) {
              byteArray.push(bString.charCodeAt(i))
            }
            blob = new Blob([new Uint8Array(byteArray)], { type: mimeType })
          } else {
            blob = new Blob([fileContent], { type: mimeType })
          }

          // workaround for supporting non-binary data
          fileContent = URL.createObjectURL(blob)
        }

        const aElement = document.createElement('a')
        aElement.setAttribute(
          'href',
          format === 'graphmlz'
            ? URL.createObjectURL(new Blob([fileContent]))
            : fileContent
        )
        aElement.setAttribute('download', fileName)
        aElement.style.display = 'none'
        document.body.appendChild(aElement)
        aElement.click()
        document.body.removeChild(aElement)

        resolve('File saved successfully')
        return
      }
      if (FileIoSupport.isMsSaveAvailable()) {
        let blob
        if (
          typeof fileContent === 'string' &&
          fileContent.startsWith('data:')
        ) {
          const dataUrlParts = fileContent.split(',')
          const bString = window.atob(dataUrlParts[1])
          const byteArray = []
          for (let i = 0; i < bString.length; i++) {
            byteArray.push(bString.charCodeAt(i))
          }
          // For the options, extract the mime type from the Data URL
          const prefix = dataUrlParts[0]
          const matchedMimeType = prefix ? prefix.match(/:(.*?);/) : ''
          blob = new Blob([new Uint8Array(byteArray)], {
            type: matchedMimeType ? matchedMimeType[1] : '',
          })
        } else if (format === 'pdf') {
          // encode content to make transparent images work correctly
          const uint8Array = new Uint8Array(fileContent.length)
          for (let i = 0; i < fileContent.length; i++) {
            uint8Array[i] = fileContent.charCodeAt(i)
          }
          blob = new Blob([uint8Array], {
            type: 'text/plain; charset=x-user-defined',
          })
        } else {
          blob = new Blob([fileContent])
        }

        if ((window.navigator as any).msSaveOrOpenBlob(blob, fileName)) {
          resolve('File saved successfully')
        } else {
          reject(
            new Error('File save failed: A failure occurred during saving.')
          )
        }
        return
      }
      reject(
        new Error(
          'File save failed: Save operation is not supported by the browser.'
        )
      )
    })
  }

  /**
   * Returns whether the File Constructor-based save technique is available.
   * This works in Firefox 28+, Chrome 38+, Opera 25+, and recent mobile browsers.
   * Currently not working in Internet Explorer nor Safari (OS X and iOS).
   * See the related demo for more details.
   * @return {boolean}
   */
  static isFileConstructorAvailable() {
    // Test whether required functions exist
    if (
      typeof window.URL !== 'function' ||
      typeof window.Blob !== 'function' ||
      typeof window.File !== 'function'
    ) {
      return false
    }
    // Test whether the constructor works as expected
    try {
      // eslint-disable-next-line no-new
      new File(['Content'], 'fileName', {
        type: 'image/png',
        lastModified: Date.now(),
      })
    } catch (ignored) {
      return false
    }
    // Everything is available
    return true
  }

  /**
   * Returns whether the MS Internet Explorer specific save technique is available.
   * This works in IE 10+. See the related demo for more details.
   * for more details.
   * @return {boolean}
   */
  static isMsSaveAvailable() {
    return (
      typeof window.Blob === 'function' &&
      typeof (window.navigator as any)['msSaveOrOpenBlob'] === 'function'
    )
  }

  static createFilePropertyBag() {
    const blobPropertyBag = {} as { type: string; lastModified: number }
    blobPropertyBag['type'] = 'image/png'
    blobPropertyBag['lastModified'] = Date.now()
    return blobPropertyBag
  }

  /**
   * Extracts the file name from the given path
   */
  static getFileName(path: string) {
    if (path.indexOf('gist.githubusercontent.com') !== -1) {
      const splitted = path.split('/')
      path = splitted[splitted.length - 1]
    }

    const matches = /(?:.*\/)?(.*)(\.(graphmlz?)?(xml)?(dot)?(gv)?(bpmn)?)/i.exec(
      path
    )
    let extractedName = path
    if (matches && matches.length > 0) {
      extractedName = matches[1]
    }
    return extractedName
  }

  /**
   * Returns the file extension for the given file.
   * @return {string | null} The file extension or null of the file name has no dot separator.
   */
  static getFileExtension(file: File) {
    const fileName = file.name
    const split = fileName.split('.')
    if (split.length > 1) {
      return split[split.length - 1].toLowerCase()
    } else {
      return null
    }
  }
}
