import { ILabel, ILabelStyle, IRenderContext, LabelStyleBase, Size, SvgVisual, Visual } from 'yfiles'

export class LevelOfDetailLabelStyle extends LabelStyleBase {  
  //The minimal width a label should have in screen coordinates to be visible
  detailWidth: number
  detailLabelStyle: ILabelStyle
  overviewLabelStyle: ILabelStyle

  /**
   * Creates a new instance of LevelOfDetailLabelStyle which combines two styles for different zoom level.
   */
  constructor(
    detailLabelStyle: ILabelStyle,
    overviewLabelStyle: ILabelStyle
  ) {
    super()
    this.detailWidth = 20
    this.detailLabelStyle = detailLabelStyle
    this.overviewLabelStyle = overviewLabelStyle
  }

  createVisual(renderContext: IRenderContext, label: ILabel): SvgVisual {
    const zoom = renderContext.zoom
    const visibleWidth = label.layout.width*zoom
    let visual: SvgVisual
    if (visibleWidth >= this.detailWidth) {
      visual = this.detailLabelStyle.renderer
        .getVisualCreator(label, this.detailLabelStyle)
        .createVisual(renderContext) as SvgVisual
      if(visual.svgElement) {  
        ;(visual.svgElement as any)['data-levelsRenderDataCache'] = this.detailLabelStyle.renderer
      }  
    } else {
      visual = this.overviewLabelStyle.renderer
        .getVisualCreator(label, this.overviewLabelStyle)
        .createVisual(renderContext) as SvgVisual
      if(visual) {
        ;(visual.svgElement as any)['data-levelsRenderDataCache'] = this.overviewLabelStyle.renderer
      }
    }

    return visual
  }

  updateVisual(renderContext: IRenderContext, oldVisual: SvgVisual, label: ILabel): Visual {
    const zoom = renderContext.zoom
    const visibleWidth = label.layout.width*zoom
    // @ts-ignore
    let newVisual: SvgVisual = null

    if (oldVisual === null) {
      return this.createVisual(renderContext, label)
    }
    const cache = (oldVisual.svgElement as any)['data-levelsRenderDataCache']
    if (visibleWidth >= this.detailWidth && cache === this.detailLabelStyle.renderer) {
      newVisual = this.detailLabelStyle.renderer
        .getVisualCreator(label, this.detailLabelStyle)
        .updateVisual(renderContext, oldVisual) as SvgVisual
      if(newVisual) {
        ;(newVisual.svgElement as any)['data-levelsRenderDataCache'] = this.detailLabelStyle.renderer
      }
      return newVisual
    } 
    else if (cache === this.overviewLabelStyle.renderer) {
      newVisual = this.overviewLabelStyle.renderer
        .getVisualCreator(label, this.overviewLabelStyle)
        .updateVisual(renderContext, oldVisual) as SvgVisual
      if(newVisual) {
        ;(newVisual.svgElement as any)['data-levelsRenderDataCache'] = this.overviewLabelStyle.renderer
      }
      return newVisual
    }
    return this.createVisual(renderContext, label)
  }

  protected getPreferredSize(label: ILabel): Size {
    return this.detailLabelStyle.renderer.getPreferredSize(label, this.detailLabelStyle)
  }
}