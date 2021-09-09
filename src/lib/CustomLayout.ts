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
  BalloonLayout,
  BezierEdgeStyle,
  CircularLayout,
  CircularLayoutData,
  CircularLayoutStyle,
  CycleSubstructureStyle,
  EdgeBundleDescriptor,
  EdgeBundlingStage,
  EdgeBundlingStageData,
  GraphComponent,
  HierarchicLayoutData,
  IEdge,
  IGraph,
  ILayoutAlgorithm,
  InterleavedMode,
  LayoutData,
  LayoutDescriptor,
  LayoutExecutor, 
  LayoutExecutorAsync,
  MinimumNodeSizeStage, 
  NodeHalo,
  NodeLabelingPolicy,
  OrganicEdgeRouter,
  OrganicLayout,
  OrganicLayoutData,
  PartitionStyle,
  RecursiveGroupLayout,
  RecursiveGroupLayoutData,
  StarSubstructureStyle,
  TimeSpan,
  TreeReductionStage,
  VoidNodeStyle
} from 'yfiles'


//@ts-ignore
import LayoutWorker from "../lib/LayoutWorker.js"
const layoutWorker = new LayoutWorker()

let _executor:LayoutExecutorAsync|null

export async function runCustomLayoutAsync(graphComponent: GraphComponent, layoutStyle: string, useEdgeBundling?: boolean): Promise<void> {
  const graph = graphComponent.graph
  const algorithm = getAlgorithmAsync(layoutStyle, graph, useEdgeBundling);

  const layoutDescriptor = algorithm.layoutDescriptor
  const layoutData = algorithm.layoutData

  // helper function that performs the actual message passing to the web worker
  function webWorkerMessageHandler(data: unknown): Promise<any> {
    return new Promise(resolve => {
      layoutWorker.onmessage = (e: any) => resolve(e.data)
      layoutWorker.postMessage(data)
    })
  }

  // create an asynchronous layout executor that calculates a layout on the worker
  const executor = new LayoutExecutorAsync({
    messageHandler: webWorkerMessageHandler,
    graphComponent,
    layoutDescriptor,
    layoutData,
    duration: '0.5s',
    animateViewport: true,
    easedAnimation: true
  })
  _executor = executor
  // run the Web Worker layout
  await executor.start()
  _executor = null
}

export async function cancelLayout(): Promise<void> {
  if(_executor !== null) {
    await _executor.cancel()
    _executor = null
    return
  }
  else {
    return
  }
}

export async function runCustomLayout(graphComponent: GraphComponent, layoutStyle: string, useEdgeBundling?: boolean) {
  const graph = graphComponent.graph
  const algorithm = getAlgorithm(layoutStyle, graph, useEdgeBundling)

  const layout = algorithm.layout
  const layoutData = algorithm.layoutData

  const layoutExecutor = new LayoutExecutor({
    graphComponent,
    layout: new MinimumNodeSizeStage(layout),
    duration: TimeSpan.fromSeconds(0.5),
    layoutData,
    animateViewport: true,
    easedAnimation: true
  })
  await layoutExecutor.start()
  if (layoutStyle !== 'aggregation') {
    removeGroupNodes(graph!)
  }
}

/**
 * Configurations for asynchronous algorithms
 */
function getAlgorithmAsync(
  layoutStyle: string,
  graph?: IGraph,
  useEdgeBundling?: boolean
): { layoutDescriptor: LayoutDescriptor; layoutData: LayoutData | null } {
  switch (layoutStyle) {
    case 'custom-circular':
      return getCustomCircularLayout(graph!, useEdgeBundling)
    case 'organic':
    default:
      return getOrganicLayout(graph!, useEdgeBundling)
  }
}

/**
 * Configurations for synchronous algorithms
 */
function getAlgorithm(
  layoutStyle: string,
  graph?: IGraph,
  useEdgeBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData | null } {
  switch (layoutStyle) {
    case 'custom-rgl-circular':
      return getCustomRGLCircularLayout(graph!, useEdgeBundling)
    case 'custom-rgl-balloon':
      return getCustomRGLBalloonLayout(graph!, useEdgeBundling)
    case 'aggregation':
      return getAggregationLayout(graph!)
    case 'custom-groups-organic':
    default:
      return getCustomGroupsOrganicLayout(graph!, useEdgeBundling)
  }
}

function getOrganicLayout(
  graph: IGraph,
  useBundling?: boolean
): { layoutDescriptor: LayoutDescriptor; layoutData: LayoutData | null } {

  //Determine the properties for the core layout
  const organicDescriptor: LayoutDescriptor = {
    name: 'OrganicLayout', properties: {
      preferredEdgeLength: 40,
      minimumNodeDistance: 20,
      compactnessFactor: 0.7,
      qualityTimeRatio: 1,
      starSubstructureStyle: "radial",
      cycleSubstructureSize: CycleSubstructureStyle.CIRCULAR,
      deterministic: true
    }
  }

  //Custom properties for the edgebundling
  const edgeBundlingProperties = useBundling? {
    bundlingStrength: 0.8,
    maximumDuration: 30000
  }:{}

  //Wrap it into a custom descriptor
  const layout:LayoutDescriptor = {
    name: 'UserDefined',
    properties: {
      useEdgeBundling: useBundling,
      edgeBundlingProperties: edgeBundlingProperties,
      coreDescriptor: organicDescriptor
    }
  }
  const layoutData = useBundling?createEdgeBundlingData(graph):null

  return {layoutDescriptor: layout, layoutData: layoutData}
}

function getCustomCircularLayout(
  graph: IGraph,
  useBundling?: boolean
): { layoutDescriptor: LayoutDescriptor; layoutData: LayoutData | null } {

  //Determine the properties for the core layout
  const circularDescriptor: LayoutDescriptor = {
    name: 'CircularLayout', properties: {
      layoutStyle: 'bcc-compact',
      partitionStyle: 'disk'
      //The other properties have to be configured on the worker side...
    }
  }

  //Custom properties for the edgebundling
  const edgeBundlingProperties = useBundling? {
    bundlingStrength: new EdgeBundlingStage().edgeBundling.bundlingStrength,
    maximumDuration: 10000
  }:{}

  //Wrap it into a custom descriptor
  const layout:LayoutDescriptor = {
    name: 'UserDefined',
    properties: {
      useEdgeBundling: useBundling,
      edgeBundlingProperties: edgeBundlingProperties,
      coreDescriptor: circularDescriptor
    }
  }
  const layoutData = useBundling?createEdgeBundlingData(graph):null
  return {layoutDescriptor: layout, layoutData: layoutData}
}

function getCustomGroupsOrganicLayout(
  graph: IGraph,
  useBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData | null } {
  addCustomGroups(graph)

  const layout = new OrganicLayout()
  layout.preferredEdgeLength = 40
  layout.minimumNodeDistance = 20
  layout.compactnessFactor = 0.7
  layout.qualityTimeRatio = 1
  layout.starSubstructureStyle = StarSubstructureStyle.RADIAL
  layout.cycleSubstructureSize = CycleSubstructureStyle.CIRCULAR
  layout.deterministic = true
  layout.hideGroupsStageEnabled = false

  let layoutData: LayoutData = new OrganicLayoutData()
  if (useBundling) {
    const edgeBundlingStage = new EdgeBundlingStage()
    edgeBundlingStage.edgeBundling.bundlingStrength = 0.8
    edgeBundlingStage.maximumDuration = 30000
    layout.prependStage(edgeBundlingStage)

    const edgeBundlingData = createEdgeBundlingData(graph)
    layoutData = layoutData.combineWith(edgeBundlingData)
  }

  return {layout, layoutData}
}

function getCustomRGLCircularLayout(
  graph: IGraph,
  useEdgeBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData } {
  addCustomGroups(graph)

  const layout = new RecursiveGroupLayout()

  const coreLayout = new CircularLayout()
  coreLayout.layoutStyle = CircularLayoutStyle.SINGLE_CYCLE
  coreLayout.singleCycleLayout.minimumNodeDistance = 0
  coreLayout.edgeBundling.bundlingStrength = 0.98
  layout.coreLayout = coreLayout

  const innerLayout = new OrganicLayout()
  innerLayout.starSubstructureStyle = StarSubstructureStyle.RADIAL
  innerLayout.prependStage(new OrganicEdgeRouter())

  const recursiveGroupLayoutData = new RecursiveGroupLayoutData()
  recursiveGroupLayoutData.groupNodeLayouts.delegate = () => innerLayout

  let layoutData: LayoutData = recursiveGroupLayoutData
  if (useEdgeBundling) {
    const circularLayoutData = new CircularLayoutData()
    graph.edges.forEach(edge => {
      const source = edge.sourceNode!
      const target = edge.targetNode!
      let bundled = false
      if (graph.degree(source) > 2 && graph.degree(target) > 2) {
        bundled = true
      }
      circularLayoutData.edgeBundleDescriptors.mapper.set(
        edge,
        new EdgeBundleDescriptor({bundled})
      )
    })
    layoutData = recursiveGroupLayoutData.combineWith(circularLayoutData)
  }

  return {layout, layoutData}
}

function getCustomRGLBalloonLayout(
  graph: IGraph,
  useEdgeBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData } {
  addCustomGroups(graph)

  const layout = new RecursiveGroupLayout()

  const coreLayout = new BalloonLayout({
    integratedNodeLabeling: true,
    nodeLabelingPolicy: NodeLabelingPolicy.RAY_LIKE_LEAVES,
    fromSketchMode: true,
    compactnessFactor: 0.1,
    allowOverlaps: true
  })
  // prepend a TreeReduction stage with the hierarchy edges as tree edges
  const treeReductionStage = new TreeReductionStage()
  coreLayout.prependStage(treeReductionStage)
  layout.coreLayout = coreLayout

  const innerLayout = new OrganicLayout()
  innerLayout.starSubstructureStyle = StarSubstructureStyle.RADIAL
  innerLayout.prependStage(new OrganicEdgeRouter())

  const recursiveGroupLayoutData = new RecursiveGroupLayoutData()
  recursiveGroupLayoutData.groupNodeLayouts.delegate = () => innerLayout

  let layoutData: LayoutData = recursiveGroupLayoutData
  if (useEdgeBundling) {
    const circularLayoutData = new CircularLayoutData()
    graph.edges.forEach(edge => {
      const source = edge.sourceNode!
      const target = edge.targetNode!
      let bundled = false
      if (graph.degree(source) > 2 && graph.degree(target) > 2) {
        bundled = true
      }
      circularLayoutData.edgeBundleDescriptors.mapper.set(
        edge,
        new EdgeBundleDescriptor({bundled})
      )
    })
    layoutData = recursiveGroupLayoutData.combineWith(circularLayoutData)
  }

  return {layout, layoutData}
}

export function getAggregationLayout(graph: IGraph): {
  layout: ILayoutAlgorithm
  layoutData: LayoutData | null
} {
  graph.edges.forEach(edge => {
    graph.setStyle(edge, new BezierEdgeStyle({stroke: '#696969'}))
  })

  const layout = new BalloonLayout({
    integratedNodeLabeling: true,
    nodeLabelingPolicy: NodeLabelingPolicy.RAY_LIKE_LEAVES,
    fromSketchMode: true,
    compactnessFactor: 0.1,
    allowOverlaps: true
  })
  // prepend a TreeReduction stage with the hierarchy edges as tree edges
  const treeReductionStage = new TreeReductionStage()
  treeReductionStage.edgeBundling.bundlingStrength = 1
  treeReductionStage.edgeBundling.defaultBundleDescriptor = new EdgeBundleDescriptor({
    bundled: true,
    bezierFitting: true
  })
  layout.prependStage(treeReductionStage)

  return {layout, layoutData: null}
}

function createEdgeBundlingData(graph: IGraph): LayoutData {
  const edgeBundlingStageData = new EdgeBundlingStageData()
  graph.edges.forEach(edge => {
    const source = edge.sourceNode!
    const target = edge.targetNode!
    let bundled = false
    if (graph.degree(source) !== 1 && graph.degree(target) !== 1) {
      bundled = true
    }
    edgeBundlingStageData.edgeBundleDescriptors.mapper.set(
      edge,
      new EdgeBundleDescriptor({bundled})
    )
  })
  return edgeBundlingStageData
}

function addCustomGroups(graph: IGraph) {
  graph.nodes.toArray().forEach(node => {
    if (graph.degree(node) > 5) {
      const group = graph.createGroupNode()
      graph.setParent(node, group)

      graph.neighbors(node).forEach(neighbor => {
        if (graph.degree(neighbor) === 1) {
          graph.setParent(neighbor, group)
        }
      })
      graph.setStyle(group, new VoidNodeStyle())
    }
  })
}

function removeGroupNodes(graph: IGraph) {
  graph.nodes.toArray().forEach(node => {
    if (graph.isGroupNode(node)) {
      graph.remove(node)
    }
  })
}
