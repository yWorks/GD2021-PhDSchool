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

import {
  Arrow,
  ArrowType,
  DefaultLabelStyle,
  EdgeCreator,
  EdgePathLabelModel,
  Fill,
  FillConvertible,
  GraphBuilder,
  IArrow,
  IdProviderConvertible,
  IEnumerable,
  IGraph,
  ImageNodeStyle,
  InteriorLabelModel,
  LabelCreator,
  NodeCreator,
  Point,
  PointConvertible,
  PolylineEdgeStyle,
  Rect,
  RectConvertible,
  ShapeNodeShape,
  ShapeNodeShapeStringValues,
  ShapeNodeStyle,
  ShapeNodeStyleRenderer,
  Size,
  StringTemplateNodeStyle,
  Stroke,
  StrokeConvertible,
} from 'yfiles'
import { VuejsNodeStyle } from './VuejsNodeStyle'
import type { LabelConfiguration } from './GraphBuilderUtils'
import {
  asLayoutParameterForEdges,
  asLayoutParameterForNodes,
  configureLabelCreator,
  maybeAddBinding,
} from './GraphBuilderUtils'

export type IdProvider<T> =
  | ((dataItem: T, canonicalId?: any | null) => any)
  | IdProviderConvertible<T>

export type EdgesSourceData<T> = {
  data: T[]
  idProvider: IdProvider<T>
  sourceIdProvider: IdProvider<T>
  targetIdProvider: IdProvider<T>
  edgeCreator?: EdgeCreator<any>
}

export type NodesSourceData<T> = {
  data: T[]
  idProvider: IdProvider<T>
  parentIdProvider: IdProvider<T> | undefined
  nodeCreator?: NodeCreator<any>
}

export type NodeCreatorConfiguration<T> = {
  template?: string
  tagProvider: ((dataItem: T) => any) | null
  isGroupProvider: ((dataItem: T) => boolean) | null
  layout: ((dataItem: T) => Rect | RectConvertible) | null
  x: ((dataItem: T) => number) | null
  y: ((dataItem: T) => number) | null
  width: ((dataItem: T) => number) | null
  height: ((dataItem: T) => number) | null
  styleProvider: NodeStyle
  fill: ((dataItem: T) => Fill | FillConvertible) | null
  shape: ((dataItem: T) => ShapeNodeShape | ShapeNodeShapeStringValues) | null
  stroke: ((dataItem: T) => Stroke | StrokeConvertible) | null
  image: ((dataItem: T) => string | null | undefined) | null
}

export type NodeStyle =
  | 'ShapeNodeStyle'
  | 'ImageNodeStyle'
  | 'TemplateNodeStyle'
  | 'VueJSNodeStyle'

export type EdgesSourceDataConfiguration<T> = {
  idProvider: IdProvider<T> | null
  sourceIdProvider: IdProvider<T> | null
  targetIdProvider: IdProvider<T> | null
}

export function buildEdgesSourceData<T = any>(
  state: { data: T[]; edgeCreator?: EdgeCreator<any> },
  configuration: EdgesSourceDataConfiguration<T>
): EdgesSourceData<T> {
  return {
    data: state.data,
    idProvider: configuration.idProvider!,
    sourceIdProvider: configuration.sourceIdProvider!,
    targetIdProvider: configuration.targetIdProvider!,
    edgeCreator: state.edgeCreator,
  }
}

export type NodesSourceDataConfiguration<T = any> = {
  idProvider: IdProvider<T> | null
  parentIdProvider: IdProvider<T> | null
}

export function buildNodesSourceData<T = any>(
  state: { data: T[]; nodeCreator?: NodeCreator<any> },
  configuration: NodesSourceDataConfiguration<T>
): NodesSourceData<T> {
  return {
    data: state.data,
    idProvider: configuration.idProvider!,
    parentIdProvider: configuration.parentIdProvider!,
    nodeCreator: state.nodeCreator,
  }
}

export function createLabelCreator<T = any>(
  labelConfiguration: LabelConfiguration<T>,
  nodes: boolean
): LabelCreator<T> {
  const creator = new LabelCreator<T>()
  configureLabelCreator(
    labelConfiguration,
    creator,
    nodes ? asLayoutParameterForNodes : asLayoutParameterForEdges
  )
  return creator
}

export function buildNodeCreator<T = any>(
  labelConfigurations: LabelConfiguration<any>[] | undefined,
  configuration: NodeCreatorConfiguration<T>
): NodeCreator<T> {
  const nodeCreator = newConfiguredNodeCreator<T>()

  const defaults = nodeCreator.defaults

  if (configuration.styleProvider === 'ImageNodeStyle') {
    nodeCreator.styleProvider = (item: any) => {
      return new ImageNodeStyle({ image: configuration.image!(item) })
    }
  } else if (configuration.styleProvider === 'ShapeNodeStyle') {
    maybeAddBinding(
      nodeCreator.styleBindings,
      'fill',
      makeEmptyValueNull(configuration.fill)
    )
    maybeAddBinding(
      nodeCreator.styleBindings,
      'stroke',
      makeEmptyValueNull(configuration.stroke)
    )

    const shapeBinding = configuration.shape
    if (shapeBinding) {
      nodeCreator.styleProvider = (item: any) => {
        return new ShapeNodeStyle({
          shape: shapeBinding(item),
          stroke: null,
          fill: null,
        })
      }
    }
  } else if (configuration.styleProvider === 'VueJSNodeStyle') {
    const vuejsNodeStyle = new VuejsNodeStyle(configuration.template || '<g/>')
    nodeCreator.styleProvider = () => vuejsNodeStyle
  } else if (configuration.styleProvider === 'TemplateNodeStyle') {
    const stringTemplateNodeStyle = new StringTemplateNodeStyle({
      svgContent: configuration.template || '<g/>',
    })
    nodeCreator.styleProvider = () => stringTemplateNodeStyle
  }

  // @ts-ignore
  nodeCreator.layoutProvider = configuration.layout
  maybeAddBinding(nodeCreator.layoutBindings, 'x', configuration.x)
  maybeAddBinding(nodeCreator.layoutBindings, 'y', configuration.y)
  maybeAddBinding(nodeCreator.layoutBindings, 'width', configuration.width)
  maybeAddBinding(nodeCreator.layoutBindings, 'height', configuration.height)

  if (configuration.tagProvider) {
    nodeCreator.tagProvider = configuration.tagProvider
  }

  if (configuration.isGroupProvider) {
    nodeCreator.isGroupPredicate = configuration.isGroupProvider
  }

  if (labelConfigurations) {
    applyLabelConfiguration(labelConfigurations, nodeCreator, true)
  }

  return nodeCreator
}

function makeEmptyValueNull<T>(
  binding:
    | ((dataItem: T) => Fill | FillConvertible | Stroke | StrokeConvertible)
    | null
) {
  return (dataItem: T) => {
    if (!binding) {
      return null
    }
    const result = binding(dataItem)
    if (typeof result === 'string' && result.trim().length === 0) {
      return null
    }
    return result
  }
}

function applyLabelConfiguration<T>(
  labelConfigurations: LabelConfiguration<any>[],
  creator: EdgeCreator<T> | NodeCreator<T>,
  nodes: boolean
) {
  for (const labelConfiguration of labelConfigurations) {
    let labelCreator: LabelCreator<any>
    const labelsBinding = labelConfiguration.labelsBinding
    const textBinding = labelConfiguration.textBinding
    if (textBinding) {
      if (labelsBinding) {
        labelCreator = creator.createLabelsSource({
          data: labelsBinding,
          text: textBinding,
        }).labelCreator
      } else {
        labelCreator = creator.createLabelBinding(textBinding)
      }
      configureLabelCreator(
        labelConfiguration,
        labelCreator,
        nodes ? asLayoutParameterForNodes : asLayoutParameterForEdges
      )
    }
  }
}

function getArrow(
  arrowBinding: ((dataItem: any) => any) | null,
  item: any
): ArrowType {
  return arrowBinding ? arrowBinding(item) : ArrowType.NONE
}

function getColor(binding: ((dataItem: any) => any) | null, item: any): string {
  return binding && binding(item) ? binding(item) : null
}

function createArrow(
  arrowBinding: ((dataItem: any) => any) | null,
  strokeBinding: ((dataItem: any) => any) | null,
  item: any
): Arrow {
  const color = getColor(strokeBinding, item)
  return new Arrow({
    type: getArrow(arrowBinding, item),
    fill: color,
    stroke: color,
  })
}

export type EdgeCreatorConfiguration<T> = {
  tagProvider: ((dataItem: T) => any) | null
  stroke: ((dataItem: T) => Stroke | StrokeConvertible) | null
  sourceArrow: ((dataItem: T) => string) | null
  targetArrow: ((dataItem: T) => string) | null
  bendsProvider:
    | ((
        dataItem: T
      ) => IEnumerable<Point | PointConvertible> | (Point | PointConvertible)[])
    | null
}

export function buildEdgeCreator<T = any>(
  labelConfigurations: LabelConfiguration<any>[] | undefined,
  configuration: EdgeCreatorConfiguration<T>
): EdgeCreator<any> {
  const edgeCreator = newConfiguredEdgeCreator<T>()

  const edgeDefaults = edgeCreator.defaults
  edgeDefaults.shareStyleInstance = false

  if (configuration.tagProvider) {
    edgeCreator.tagProvider = configuration.tagProvider
  }

  maybeAddBinding(
    edgeCreator.styleBindings,
    'stroke',
    makeEmptyValueNull(configuration.stroke)
  )
  maybeAddBinding(edgeCreator.styleBindings, 'sourceArrow', (item: T) =>
    createArrow(
      configuration.sourceArrow,
      makeEmptyValueNull(configuration.stroke),
      item
    )
  )
  maybeAddBinding(edgeCreator.styleBindings, 'targetArrow', (item: T) =>
    createArrow(
      configuration.targetArrow,
      makeEmptyValueNull(configuration.stroke),
      item
    )
  )

  edgeCreator.styleProvider = (item: any) => {
    return new PolylineEdgeStyle({
      stroke: null,
      sourceArrow: IArrow.NONE,
      targetArrow: IArrow.NONE,
    })
  }

  if (configuration.bendsProvider) {
    // @ts-expect-error
    edgeCreator.bendsProvider = configuration.bendsProvider
  }

  if (labelConfigurations) {
    applyLabelConfiguration(labelConfigurations, edgeCreator, false)
  }

  return edgeCreator
}

export function buildLabelConfiguration<T = any>(
  configuration: LabelConfiguration<T>
): LabelConfiguration<T> {
  return {
    labelsBinding: configuration.labelsBinding,
    textBinding: configuration.textBinding,
    placement: configuration.placement,
    fill: configuration.fill,
  }
}

export function buildGraph(state: {
  nodesSources?: NodesSourceData<any>[]
  edgesSources?: EdgesSourceData<any>[]
}): IGraph {
  const builder = new GraphBuilder()

  for (const src of state.nodesSources || []) {
    if (!src.data) {
      continue
    }

    const nodesSource = builder.createNodesSource({
      data: src.data,
      id: src.idProvider,
      parentId: src.parentIdProvider,
    })
    nodesSource.nodeCreator = src.nodeCreator
      ? src.nodeCreator
      : newConfiguredNodeCreator()

    const creator = nodesSource.nodeCreator
  }

  for (const src of state.edgesSources || []) {
    if (!src.data) {
      continue
    }

    const edgesSource = builder.createEdgesSource(
      src.data,
      src.sourceIdProvider,
      src.targetIdProvider,
      src.idProvider
    )
    if (src.edgeCreator) {
      edgesSource.edgeCreator = src.edgeCreator
    } else {
      edgesSource.edgeCreator = newConfiguredEdgeCreator()
    }

    const creator = edgesSource.edgeCreator
  }

  builder.updateGraph()
  return builder.graph
}

function newConfiguredNodeCreator<T>(): NodeCreator<T> {
  const nodeCreator = new NodeCreator<T>()
  const nodeDefaults = nodeCreator.defaults
  nodeDefaults.style = new ShapeNodeStyle({
    shape: 'round-rectangle',
    fill: '#eee',
    stroke: '#323232',
  })
  ;(nodeDefaults.style
    .renderer as ShapeNodeStyleRenderer).roundRectArcRadius = 3
  nodeDefaults.shareStyleInstance = false
  nodeDefaults.size = new Size(60, 30)

  const labelDefaults = nodeDefaults.labels
  labelDefaults.style = new DefaultLabelStyle({
    textSize: 14,
    textFill: 'black',
  })
  labelDefaults.shareStyleInstance = true
  labelDefaults.layoutParameter = InteriorLabelModel.SOUTH
  return nodeCreator
}

function newConfiguredEdgeCreator<T>(): EdgeCreator<T> {
  const edgeCreator = new EdgeCreator<T>()
  const edgeDefaults = edgeCreator.defaults
  edgeDefaults.style = new PolylineEdgeStyle({
    stroke: '#eee',
    smoothingLength: 5,
    targetArrow: '#eee medium triangle',
  })
  edgeDefaults.shareStyleInstance = false

  const labelDefaults = edgeDefaults.labels
  labelDefaults.style = new DefaultLabelStyle({
    textSize: 12,
    textFill: '#eee',
  })
  labelDefaults.shareStyleInstance = true
  labelDefaults.layoutParameter = new EdgePathLabelModel({
    autoRotation: false,
  }).createRatioParameter()
  return edgeCreator
}
