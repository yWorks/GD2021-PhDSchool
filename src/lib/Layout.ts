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
  CircularLayout,
  CircularLayoutStyle,
  DefaultGraph,
  DefaultNodePlacer,
  GenericLabeling,
  HierarchicLayout,
  HierarchicLayoutData,
  IGraph,
  ILayoutAlgorithm,
  INode,
  LayoutData,
  LayoutOrientation,
  MinimumNodeSizeStage,
  OrganicLayout,
  OrganicLayoutData,
  OrthogonalLayout,
  PartitionGridData,
  TreeLayout,
  TreeReductionStage,
} from 'yfiles'

export type LayoutConfiguration = {
  layoutStyle: 'hierarchic' | 'organic' | 'orthogonal' | 'circular' | 'tree'
  layoutOrientation:
    | 'top-to-bottom'
    | 'bottom-to-top'
    | 'left-to-right'
    | 'right-to-left'
  edgeLabeling: boolean
  edgeLength: number
  nodeDistance: number
  edgeGrouping: boolean
  compactness: number
  gridSpacing: number
  circularLayoutStyle: 'bcc-compact' | 'bcc-isolated' | 'single-cycle'
  gridColumns: ((nodeTag: any) => number) | null
  gridRows: ((nodeTag: any) => number) | null
}

export function arrange<T extends IGraph | undefined>(
  graph: T | undefined,
  configuration: LayoutConfiguration
): T | IGraph {
  if (graph) {
    const layoutData = getLayoutData(configuration)
    if (layoutData) {
      graph.applyLayout(
        new MinimumNodeSizeStage(getAlgorithm(configuration)),
        layoutData
      )
    } else {
      graph.applyLayout(new MinimumNodeSizeStage(getAlgorithm(configuration)))
    }
  }
  return graph || new DefaultGraph()
}

function getAlgorithm(configuration: LayoutConfiguration): ILayoutAlgorithm {
  switch (configuration.layoutStyle) {
    case 'organic':
      return getOrganicLayout(configuration)
    case 'orthogonal':
      return getOrthogonalLayout(configuration)
    case 'circular':
      return getCircularLayout(configuration)
    case 'tree':
      return getTreeLayout(configuration)
    case 'hierarchic':
    default:
      return getHierarchicLayout(configuration)
  }
}

function createNodeTagIndexFunction(
  bindingFunction: ((dataItem: any) => any) | null
): ((node: INode) => number | null) | null {
  if (bindingFunction) {
    return (node) => {
      const value = bindingFunction(node.tag)
      if (typeof value === 'undefined' || value === null) {
        return 0
      } else {
        return Number(value) | 0
      }
    }
  } else {
    return null
  }
}

function createPartitionGridData(
  configuration: LayoutConfiguration
): null | PartitionGridData {
  const columnFunction = createNodeTagIndexFunction(configuration.gridColumns)
  const rowFunction = createNodeTagIndexFunction(configuration.gridRows)
  if (columnFunction || rowFunction) {
    const gridData = new PartitionGridData()
    if (rowFunction) {
      gridData.rowIndices.delegate = rowFunction as (key: INode) => number
    }
    if (columnFunction) {
      gridData.columnIndices.delegate = columnFunction as (key: INode) => number
    }
    return gridData
  }
  return null
}

function getLayoutData(configuration: LayoutConfiguration): LayoutData | null {
  switch (configuration.layoutStyle) {
    case 'organic': {
      const partitionGridData = createPartitionGridData(configuration)
      if (partitionGridData !== null) {
        return new OrganicLayoutData({ partitionGridData })
      }
      break
    }
    case 'hierarchic': {
      const partitionGridData = createPartitionGridData(configuration)
      if (partitionGridData !== null) {
        return new HierarchicLayoutData({ partitionGridData })
      }
      break
    }
  }
  return null
}

function getHierarchicLayout(
  configuration: LayoutConfiguration
): ILayoutAlgorithm {
  const layout = new HierarchicLayout()
  layout.layoutOrientation = getLayoutOrientation(configuration)
  layout.integratedEdgeLabeling = configuration.edgeLabeling
  layout.nodeToNodeDistance = configuration.nodeDistance
  layout.automaticEdgeGrouping = configuration.edgeGrouping
  layout.orthogonalRouting = true
  return layout
}

function getOrganicLayout(
  configuration: LayoutConfiguration
): ILayoutAlgorithm {
  const layout = new OrganicLayout()
  layout.preferredEdgeLength = configuration.edgeLength
  layout.minimumNodeDistance = configuration.nodeDistance
  layout.compactnessFactor = configuration.compactness
  ;(layout.labeling as GenericLabeling).placeEdgeLabels = true
  ;(layout.labeling as GenericLabeling).placeNodeLabels = false
  layout.labelingEnabled = configuration.edgeLabeling
  return layout
}

function getOrthogonalLayout(
  configuration: LayoutConfiguration
): ILayoutAlgorithm {
  const layout = new OrthogonalLayout()
  layout.gridSpacing = configuration.gridSpacing
  layout.integratedEdgeLabeling = configuration.edgeLabeling
  return layout
}

function getCircularLayout(
  configuration: LayoutConfiguration
): ILayoutAlgorithm {
  const layout = new CircularLayout()
  layout.layoutStyle = getCircularLayoutStyle(configuration)
  ;(layout.labeling as GenericLabeling).placeEdgeLabels = true
  ;(layout.labeling as GenericLabeling).placeNodeLabels = false
  layout.labelingEnabled = configuration.edgeLabeling
  return layout
}

function getTreeLayout(configuration: LayoutConfiguration): ILayoutAlgorithm {
  const layout = new TreeLayout()
  layout.layoutOrientation = getLayoutOrientation(configuration)
  layout.integratedEdgeLabeling = configuration.edgeLabeling
  const nodePlacer = layout.defaultNodePlacer as DefaultNodePlacer
  nodePlacer.horizontalDistance = configuration.nodeDistance
  nodePlacer.verticalDistance = configuration.nodeDistance
  return new TreeReductionStage(layout)
}

function getLayoutOrientation(
  configuration: LayoutConfiguration
): LayoutOrientation {
  switch (configuration.layoutOrientation) {
    case 'bottom-to-top':
      return LayoutOrientation.BOTTOM_TO_TOP
    case 'left-to-right':
      return LayoutOrientation.LEFT_TO_RIGHT
    case 'right-to-left':
      return LayoutOrientation.RIGHT_TO_LEFT
    case 'top-to-bottom':
    default:
      return LayoutOrientation.TOP_TO_BOTTOM
  }
}

function getCircularLayoutStyle(
  configuration: LayoutConfiguration
): CircularLayoutStyle {
  switch (configuration.circularLayoutStyle) {
    case 'bcc-isolated':
      return CircularLayoutStyle.BCC_ISOLATED
    case 'single-cycle':
      return CircularLayoutStyle.SINGLE_CYCLE
    case 'bcc-compact':
    default:
      return CircularLayoutStyle.BCC_COMPACT
  }
}
