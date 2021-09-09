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

import { GraphComponent, IGraph, Rect, Size, SvgExport } from 'yfiles'
import { FileIoSupport } from './FileIoSupport'
import { detectInternetExplorerVersion } from './Workarounds'

export enum ExportFormat {
  SVG = 'SVG-FORMAT',
  PNG = 'PNG-FORMAT',
  PDF = 'PDF-FORMAT',
}

export class ExportSupport {
  /**
   * Creates an SVG element that can be exported to different formats.
   * @param graph The graph to be exported.
   * @param exportArea The area to be exported.
   * @param scale The scale of the exported graph.
   * @returns {Promise<{size: Size, svgElement: SVGSVGElement}>}
   * @yjs:keep=viewBox
   */
  static prepareSvg(graph: IGraph, exportArea: Rect, scale: number) {
    // Create a new graph control for exporting the original SVG content
    const exportControl = new GraphComponent()
    exportControl.graph = graph

    exportControl.updateContentRect()

    // Determine the bounds of the exported area
    exportControl.zoomTo(exportArea)

    // Create the exporter class
    const exporter = new SvgExport(exportArea, scale)

    if (window['btoa'] !== undefined) {
      exporter.inlineSvgImages = true
    }

    // export only if some content is available
    return exporter.exportSvgAsync(exportControl).then((svgElement) => {
      const {
        width: exportWidth,
        height: exportHeight,
      } = (svgElement as SVGSVGElement).viewBox.baseVal

      return {
        svgElement: svgElement as SVGSVGElement,
        size: new Size(exportWidth, exportHeight),
      }
    })
  }

  /**
   * Saves the graph as SVG file.
   * @param graph The graph to be exported.
   * @param exportArea The area to be exported.
   * @param scale The scale of the exported graph.
   */
  static saveSvg(graph: IGraph, exportArea: Rect, scale: number) {
    ExportSupport.prepareSvg(graph, exportArea, scale).then((result) => {
      const documentName = 'export'
      ExportSupport.downloadSvg(
        result.svgElement,
        result.size,
        documentName,
        ExportFormat.SVG
      )
    })
  }

  /**
   * Saves the graph as PNG file.
   * @param graph The graph to be exported.
   * @param exportArea The area to be exported.
   * @param scale The scale of the exported graph.
   */
  static savePng(graph: IGraph, exportArea: Rect, scale: number) {
    ExportSupport.prepareSvg(graph, exportArea, scale).then((result) => {
      const svgElement = result.svgElement
      const size = result.size
      const documentName = 'export'
      ExportSupport.downloadSvg(
        svgElement,
        size,
        documentName,
        ExportFormat.PNG
      )
    })
  }

  /**
   * Saves the graph as PDF file.
   */
  static savePdf(graph: IGraph, exportArea: Rect, scale: number) {
    ExportSupport.prepareSvg(graph, exportArea, scale).then((result) => {
      const svgElement = result.svgElement.cloneNode(true) as SVGSVGElement
      const size = result.size
      const documentName = 'export'

      ExportSupport.downloadSvg(
        svgElement,
        size,
        documentName,
        ExportFormat.PDF
      )
    })
  }

  /**
   * Downloads the given svg element to a file on the client
   */
  static async downloadSvg(
    svg: SVGSVGElement,
    size: Size,
    name: string,
    format: ExportFormat
  ) {
    if (format === ExportFormat.PNG) {
      const targetCanvas = document.createElement('canvas')
      const targetContext = targetCanvas.getContext('2d')

      const svgUrl = SvgExport.encodeSvgDataUrl(SvgExport.exportSvgString(svg))

      if (
        window['btoa'] === undefined ||
        detectInternetExplorerVersion() > 11
      ) {
        // Use the canvg fall-back if the function btoa is not available, e.g. in IE9
        ExportSupport.exportImageWithCanvg(svg, '').then((image) => {
          FileIoSupport.saveToFile(image.src, `${name}.png`)
        })
        return
      }

      if (!targetContext) {
        return
      }

      // The SVG image is now used as the source of an HTML image element,
      // which is then rendered onto a canvas element.

      // An image that gets the export SVG in the Data URL format
      const svgImage = new Image()
      svgImage.src = svgUrl

      svgImage.onload = () => {
        targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
        targetCanvas.width = size.width
        targetCanvas.height = size.height

        // IE11 on Windows 7 needs a timeout here
        setTimeout(
          () => {
            try {
              targetContext.drawImage(svgImage, 0, 0)

              // When the svg image has been rendered to the Canvas,
              // the raster image can be exported from the Canvas.
              const pngImage = new Image()
              // The following 'toDataURL' function throws a security error in IE
              pngImage.src = targetCanvas.toDataURL('image/png')
              pngImage.onload = () => {
                FileIoSupport.saveToFile(pngImage.src, `${name}.png`)
              }
            } catch (error) {
              // Use the canvg fall-back when the above solution doesn't work
              ExportSupport.exportImageWithCanvg(svg, error as any).then(
                (image) => {
                  FileIoSupport.saveToFile(image.src, `${name}.png`)
                }
              )
            }
          },
          detectInternetExplorerVersion() > -1 ? 100 : 0
        )
      }
    } else if (format === ExportFormat.SVG) {
      FileIoSupport.saveToFile(SvgExport.exportSvgString(svg), `${name}.svg`)
    } else if (format === ExportFormat.PDF) {
      const sizeArray = new Array(2)
      sizeArray[0] = size.width
      sizeArray[1] = size.height

      const [jsPdfModule] = await Promise.all([
        // @ts-ignore
        import(/* webpackChunkName: "jspdf" */ 'jspdf'),
        // @ts-ignore
        import(/* webpackChunkName: "svg2pdf" */ 'svg2pdf.js'),
      ])

      // eslint-disable-next-line no-undef,new-cap
      const doc = new jsPdfModule.default({
        orientation: size.width > size.height ? 'l' : 'p',
        unit: 'pt',
        format: sizeArray,
        compress: true,
      })
      try {
        // eslint-disable-next-line no-undef
        doc.svg(svg).then(() => {
          FileIoSupport.saveToFile(doc.output(), `${name}.pdf`)
        })
      } catch (e) {
        throw new Error('Error during PDF export.')
      }
    }
  }

  /**
   * Use canvg as callback if the default solution is not available.
   */
  static exportImageWithCanvg(svgElement: SVGSVGElement, error: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      // @ts-ignore
      if (!svgElement.toDataURL) {
        // The default approach failed, and this callback will not work either.
        reject(
          new Error(
            `This browser doesn't support exporting the raster image: ${error}`
          )
        )
      }

      // @ts-ignore
      svgElement.toDataURL('image/png', {
        callback: (dataURL: string) => {
          const image = new Image()
          image.src = dataURL
          image.onload = () => {
            // we need to do it 2 times otherwise gradients are not exported properly in MS Edge for whatever reason
            // @ts-ignore
            svgElement.toDataURL('image/png', {
              callback: (dataURL: string) => {
                const image = new Image()
                image.src = dataURL
                image.onload = () => {
                  resolve(image)
                }
              },
            })
          }
        },
      })
    })
  }
}
