import { INode, INodeStyle, IRenderContext, NodeStyleBase, SvgVisual, Visual, GeneralPath } from 'yfiles'

export class LevelOfDetailNodeStyle extends NodeStyleBase {
  detailThreshold: number
  detailNodeStyle: INodeStyle
  overviewNodeStyle: INodeStyle

  /**
   * Creates a new instance of LevelOfDetailNodeStyle which combines three styles for different zoom level.
   */
  constructor(
    detailNodeStyle: INodeStyle,
    overviewNodeStyle: INodeStyle
  ) {
    super()
    this.detailThreshold = 20
    this.detailNodeStyle = detailNodeStyle
    this.overviewNodeStyle = overviewNodeStyle
  }

  createVisual(renderContext: IRenderContext, node: INode): SvgVisual {
    const zoom = renderContext.zoom
    const useDetail = (node.layout.width*zoom >= this.detailThreshold) && (node.layout.height*zoom >= this.detailThreshold)
    let visual: SvgVisual
    if (useDetail) {
      visual = this.detailNodeStyle.renderer
        .getVisualCreator(node, this.detailNodeStyle)
        .createVisual(renderContext) as SvgVisual
      ;(visual.svgElement as any)['data-levelsRenderDataCache'] = this.detailNodeStyle.renderer
    } else {
      visual = this.overviewNodeStyle.renderer
        .getVisualCreator(node, this.overviewNodeStyle)
        .createVisual(renderContext) as SvgVisual
      ;(visual.svgElement as any)['data-levelsRenderDataCache'] = this.overviewNodeStyle.renderer
    }

    return visual
  }

  updateVisual(renderContext: IRenderContext, oldVisual: SvgVisual, node: INode): Visual {
    const zoom = renderContext.zoom
    const useDetail = (node.layout.width*zoom >= this.detailThreshold) && (node.layout.height*zoom >= this.detailThreshold)
    // @ts-ignore
    let newVisual: SvgVisual = null

    if (oldVisual === null) {
      return this.createVisual(renderContext, node)
    }
    const cache = (oldVisual.svgElement as any)['data-levelsRenderDataCache']
    if (useDetail && cache === this.detailNodeStyle.renderer) {
      newVisual = this.detailNodeStyle.renderer
        .getVisualCreator(node, this.detailNodeStyle)
        .updateVisual(renderContext, oldVisual) as SvgVisual
      ;(newVisual.svgElement as any)['data-levelsRenderDataCache'] = this.detailNodeStyle.renderer
      return newVisual
    } else if (!useDetail && cache === this.overviewNodeStyle.renderer) {
      newVisual = this.overviewNodeStyle.renderer
        .getVisualCreator(node, this.overviewNodeStyle)
        .updateVisual(renderContext, oldVisual) as SvgVisual
      ;(newVisual.svgElement as any)['data-levelsRenderDataCache'] = this.overviewNodeStyle.renderer
      return newVisual
    }
    return this.createVisual(renderContext, node)
  }

  getOutline (node: INode) : GeneralPath|null {
      const geom = this.detailNodeStyle.renderer.getShapeGeometry(node, this.detailNodeStyle)
      return geom ? geom.getOutline() : super.getOutline(node)
  }
}