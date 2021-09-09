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
  BetweennessCentrality,
  BiconnectedComponentClustering,
  ClosenessCentrality,
  DegreeCentrality,
  delegate,
  EdgeBetweennessClustering,
  EigenvectorCentrality,
  HierarchicalClustering,
  IEdge,
  IEnumerable,
  IGraph,
  ILabelModelParameter,
  ILabelOwner,
  IModelItem,
  INode,
  ItemCollection,
  ItemCollectionConvertible,
  ItemMapping,
  ItemMappingConvertible,
  KMeansClustering,
  LabelCreator,
  LabelPropagationClustering,
  LouvainModularityClustering,
  PageRank,
  ResultItemMapping,
} from 'yfiles'
import type { LabelConfiguration } from './GraphBuilderUtils'
import {
  asLayoutParameterForEdges,
  asLayoutParameterForNodes,
  configureLabelCreator,
} from './GraphBuilderUtils'
import { setPropertyPath } from './PropertyUtils'

function createLabelCreator<T>(
  labelConfiguration: LabelConfiguration<T>,
  nodes: boolean
): LabelCreator<T> {
  const creator = new LabelCreator<T>()
  configureAnalyticsLabelCreator(
    labelConfiguration,
    creator,
    nodes ? asLayoutParameterForNodes : asLayoutParameterForEdges
  )
  return creator
}

function configureAnalyticsLabelCreator<T>(
  labelConfiguration: LabelConfiguration<T>,
  labelCreator: LabelCreator<T>,
  layoutParameterProvider: (placement: string) => ILabelModelParameter
) {
  configureLabelCreator(
    labelConfiguration,
    labelCreator,
    layoutParameterProvider
  )

  const labelBinding = labelConfiguration.textBinding
  if (labelBinding) {
    labelCreator.textProvider = labelBinding
  } else {
    labelCreator.textProvider = (item) => String(item)
  }
}

export type AnalyticsConfiguration = {
  clusterCount: number
  resultPropertyName: string
  edgeWeights: ((edge: IEdge) => number) | null
  subgraphNodes: ((node: INode) => boolean) | null
  subgraphEdges: ((edge: IEdge) => boolean) | null
  directed: boolean
  analysisMode: CentralityType
}

export type CentralityType =
  | 'node betweenness'
  | 'edge betweenness'
  | 'degree'
  | 'eigenvector'
  | 'pagerank'
  | 'closeness'
  | 'louvainmodularity'
  | 'edge betweenness clustering'
  | 'KMeans clustering'
  | 'Hierarchical clustering'
  | 'Biconnected Component Clustering'
  | 'Label Propagation Clustering'

export function analyze<T extends IGraph | undefined>(
  state: { in?: T; labelConfigurations?: LabelConfiguration<any>[] },
  configuration: AnalyticsConfiguration
): T | undefined {
  const graph = state.in
  if (graph) {
    let resultSetter:
      | ((item: INode | IEdge, value: number) => void)
      | null = null

    const isNode = configuration.analysisMode !== 'edge betweenness'

    // First store the result in the tag
    if (
      configuration.resultPropertyName &&
      configuration.resultPropertyName.length > 0
    ) {
      resultSetter = delegate.combine(
        resultSetter,
        storeInTag(configuration.resultPropertyName)
      )
    }

    if (state.labelConfigurations) {
      for (const labelConfiguration of state.labelConfigurations) {
        resultSetter = delegate.combine(
          resultSetter,
          createLabel(graph!, createLabelCreator(labelConfiguration, isNode))
        )
      }
    }

    const subgraphConfiguration: {
      subgraphNodes?: ItemCollection<INode> | ItemCollectionConvertible<INode>
      subgraphEdges?: ItemCollection<IEdge> | ItemCollectionConvertible<IEdge>
    } = {}

    const edgeWeightConfiguration: {
      weights?:
        | ItemMapping<IEdge, number>
        | ItemMappingConvertible<IEdge, number>
      edgeWeights?:
        | ItemMapping<IEdge, number>
        | ItemMappingConvertible<IEdge, number>
    } = {}

    if (configuration.subgraphNodes) {
      subgraphConfiguration.subgraphNodes = configuration.subgraphNodes
    }
    if (configuration.subgraphEdges) {
      subgraphConfiguration.subgraphEdges = configuration.subgraphEdges
    }

    if (configuration.edgeWeights) {
      if (configuration.analysisMode === 'pagerank') {
        edgeWeightConfiguration.edgeWeights = configuration.edgeWeights
      } else {
        edgeWeightConfiguration.weights = configuration.edgeWeights
      }
    }

    switch (configuration.analysisMode) {
      case 'closeness':
        storeResults(
          graph.nodes,
          new ClosenessCentrality({
            directed: configuration.directed,
            ...edgeWeightConfiguration,
            ...subgraphConfiguration,
          }).run(graph!).normalizedNodeCentrality,
          resultSetter
        )
        break
      case 'degree':
        storeResults(
          graph.nodes,
          new DegreeCentrality({
            considerIncomingEdges: true,
            considerOutgoingEdges: true,
            ...subgraphConfiguration,
          }).run(graph!).normalizedNodeCentrality,
          resultSetter
        )
        break
      case 'edge betweenness':
        storeResults(
          graph.edges,
          new BetweennessCentrality({
            directed: configuration.directed,
            ...edgeWeightConfiguration,
            ...subgraphConfiguration,
          }).run(graph!).normalizedEdgeCentrality,
          resultSetter
        )
        break
      case 'louvainmodularity':
        storeResults(
          graph.nodes,
          new LouvainModularityClustering({
            ...edgeWeightConfiguration,
            ...subgraphConfiguration,
          }).run(graph!).nodeClusterIds,
          resultSetter
        )
        break
      case 'edge betweenness clustering':
        storeResults(
          graph.nodes,
          new EdgeBetweennessClustering({
            directed: configuration.directed,
            ...edgeWeightConfiguration,
            ...subgraphConfiguration,
          }).run(graph!).nodeClusterIds,
          resultSetter
        )
        break
      case 'KMeans clustering':
        storeResults(
          graph.nodes,
          new KMeansClustering({
            k: configuration.clusterCount,
            ...subgraphConfiguration,
          }).run(graph!).nodeClusterIds,
          resultSetter
        )
        break
      case 'Biconnected Component Clustering':
        storeResults(
          graph.nodes,
          new BiconnectedComponentClustering({
            ...subgraphConfiguration,
          }).run(graph!).nodeClusterIds,
          resultSetter
        )
        break
      case 'Label Propagation Clustering':
        storeResults(
          graph.nodes,
          new LabelPropagationClustering({
            ...subgraphConfiguration,
          }).run(graph!).nodeClusterIds,
          resultSetter
        )
        break
      case 'node betweenness':
        storeResults(
          graph.nodes,
          new BetweennessCentrality({
            directed: configuration.directed,
            ...edgeWeightConfiguration,
            ...subgraphConfiguration,
          }).run(graph!).normalizedNodeCentrality,
          resultSetter
        )
        break
      case 'Hierarchical clustering':
        storeResults(
          graph.nodes,
          new HierarchicalClustering({
            ...subgraphConfiguration,
          }).run(graph!).nodeClusterIds,
          resultSetter
        )
        break
      case 'eigenvector':
        storeResults(
          graph.nodes,
          new EigenvectorCentrality({
            ...subgraphConfiguration,
          }).run(graph!).nodeCentrality,
          resultSetter
        )
        break
      case 'pagerank':
        storeResults(
          graph.nodes,
          new PageRank({
            ...edgeWeightConfiguration,
            ...subgraphConfiguration,
          }).run(graph!).pageRank,
          resultSetter
        )
        break
    }
  }
  return graph
}

function storeInTag<TItem extends IModelItem, TValue>(
  key: string
): (item: TItem, value: TValue) => void {
  return (item, value) => {
    setPropertyPath(item.tag, key, value)
  }
}

function createLabel<TItem extends ILabelOwner, TValue>(
  graph: IGraph,
  labelCreator: LabelCreator<TValue>
): (item: TItem, value: TValue) => void {
  return (item, value) => {
    labelCreator.addLabel(graph, item, item.tag)
  }
}

function storeResults<TItem extends IModelItem, TValue>(
  elements: IEnumerable<TItem>,
  itemMapping: ResultItemMapping<TItem, TValue>,
  setter: ((item: TItem, value: TValue) => void) | null | undefined
) {
  if (setter) {
    itemMapping.forEach(({ key: item, value }) => {
      setter(item, value)
    })
  }
}
