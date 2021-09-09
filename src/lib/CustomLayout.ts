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
  IGraph,
  ILayoutAlgorithm,
  InterleavedMode,
  LayoutData,
  LayoutExecutor,
  MinimumNodeSizeStage,
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

function getAlgorithm(
  layoutStyle: string,
  graph?: IGraph,
  useEdgeBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData | null } {
  switch (layoutStyle) {
    case 'custom-circular':
      return getCustomCircularLayout(graph!, useEdgeBundling)
    case 'custom-groups-organic':
      return getCustomGroupsOrganicLayout(graph!, useEdgeBundling)
    case 'custom-rgl-circular':
      return getCustomRGLCircularLayout(graph!, useEdgeBundling)
    case 'custom-rgl-balloon':
      return getCustomRGLBalloonLayout(graph!, useEdgeBundling)
    case 'aggregation':
      return getAggregationLayout(graph!)
    case 'organic':
    default:
      return getOrganicLayout(graph!, useEdgeBundling)
  }
}

function getOrganicLayout(
  graph: IGraph,
  useBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData | null } {
  const layout = new OrganicLayout()
  layout.preferredEdgeLength = 40
  layout.minimumNodeDistance = 20
  layout.compactnessFactor = 0.7
  layout.qualityTimeRatio = 1
  layout.starSubstructureStyle = StarSubstructureStyle.RADIAL
  layout.cycleSubstructureSize = CycleSubstructureStyle.CIRCULAR
  layout.deterministic = true

  let layoutData = null
  if (useBundling) {
    const edgeBundlingStage = new EdgeBundlingStage()
    edgeBundlingStage.edgeBundling.bundlingStrength = 0.8
    edgeBundlingStage.maximumDuration = 30000
    layout.prependStage(edgeBundlingStage)

    layoutData = createEdgeBundlingData(graph)
  }

  return {layout, layoutData}
}

function getCustomCircularLayout(
  graph: IGraph,
  useBundling?: boolean
): { layout: ILayoutAlgorithm; layoutData: LayoutData | null } {
  const layout = new CircularLayout()
  layout.layoutStyle = CircularLayoutStyle.BCC_COMPACT
  layout.partitionStyle = PartitionStyle.DISK
  layout.singleCycleLayout.minimumNodeDistance = 30

  layout.balloonLayout.compactnessFactor = 0.9
  layout.balloonLayout.minimumEdgeLength = 5
  layout.balloonLayout.preferredChildWedge = 359
  layout.balloonLayout.allowOverlaps = true
  layout.balloonLayout.interleavedMode = InterleavedMode.ALL_NODES

  let layoutData = null
  if (useBundling) {
    const edgeBundlingStage = new EdgeBundlingStage()
    edgeBundlingStage.maximumDuration = 10000
    layout.prependStage(edgeBundlingStage)

    layoutData = createEdgeBundlingData(graph)
  }

  return {layout, layoutData}
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
