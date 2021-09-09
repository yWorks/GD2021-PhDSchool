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

import { project } from './Projection'
import { analyze } from './Analytics'
import { httpRequest } from './WebLoader'
import {
  buildEdgeCreator,
  buildEdgesSourceData,
  buildGraph,
  buildLabelConfiguration,
  buildNodeCreator,
  buildNodesSourceData,
} from './GraphBuilder'
import { arrange } from './Layout'

/**
 * This is automatically generated source code. It is largely undocumented and not necessarily
 * instructive, nor the best way to solve a given task. If you want to learn more about the
 * yFiles API, as a starting point, please consider the more instructive source code tutorial and
 * more than 200 examples on https://live.yworks.com - you will also find the complete sources to
 * these demos for you to play with as part of the evaluation package and online at
 * https://github.com/yWorks/yfiles-for-html-demos/
 * The API documentation is also available online, here: https://docs.yworks.com/yfileshtml - Enjoy!
 */
export default async function loadGraph() {
  const value = await httpRequest({
    url: 'https://yworks-live3.com/phd-school/original-data.json',
    method: 'GET',
    body: '',
    basicAuth: false,
    username: undefined,
    password: undefined,
    headers: '',
    params: '',
  })
  const data = value ? JSON.parse(value) : {}
  const out = await project(data, { binding: (item) => item.edgeList })
  const out2 = await project(data, { binding: (item) => item.nodeList })
  const labelConfiguration = await buildLabelConfiguration({
    labelsBinding: null,
    textBinding: new Function(
      'with(arguments[0]) { return ("Louvain: "+louvain) }'
    ) as (...args: any[]) => any,
    placement: () => 'bottom',
    fill: () => 'red',
  })
  const edgeCreator = await buildEdgeCreator(undefined, {
    tagProvider: (item) => item.tag,
    stroke: (item) => `${item.tag.thickness}px ${item.tag.color}`,
    sourceArrow: () => 'none',
    targetArrow: () => 'none',
    bendsProvider: null,
  })
  const edgesSource = await buildEdgesSourceData(
    { data: out, edgeCreator },
    {
      idProvider: (item) => item.id,
      sourceIdProvider: (item) => item.source,
      targetIdProvider: (item) => item.target,
    }
  )
  const labelConfiguration2 = await buildLabelConfiguration({
    labelsBinding: (item) => item.labels,
    textBinding: (item) => item.text,
    placement: () => 'center',
    fill: null,
  })
  const nodeCreator = await buildNodeCreator([labelConfiguration2], {
    tagProvider: (item) => item.tag,
    isGroupProvider: null,
    layout: null,
    x: null,
    y: null,
    width: new Function(
      'with(arguments[0]) { return (30 + (800 - 30)*((tag.connections - 1) / (310 - 1))) }'
    ) as (...args: any[]) => any,
    height: new Function(
      'with(arguments[0]) { return (30 + (800 - 30)*((tag.connections - 1) / (310 - 1))) }'
    ) as (...args: any[]) => any,
    styleProvider: 'VueJSNodeStyle',
    fill: (item) => `${item.tag.color}`,
    shape: () => 'ellipse',
    stroke: () => '1px white',
    image: null,
    template:
      '<g>\n  <template v-if="zoom >= 0.1">\n    <ellipse fill="white"\n             :cx="layout.width*0.5" :cy="layout.height*0.5"\n             :rx="layout.width*0.5" :ry="layout.height*0.5">\n    </ellipse>  \n  </template>  \n  <ellipse :fill="tag.color"\n           :cx="layout.width*0.5" :cy="layout.height*0.5"\n           :rx="layout.width*0.49" :ry="layout.height*0.49">\n  </ellipse>  \n  <template v-if="zoom >= 0.1">\n    <image :xlink:href="\'https://yworks-live3.com/phd-school/flags/\' + tag.label + \'.svg\'" :x="layout.width*0.25" :y="layout.height*0.15" :width="layout.width*0.5"></image>\n  </template>  \n</g>',
  })
  const nodesSource = await buildNodesSourceData(
    { data: out2, nodeCreator },
    { idProvider: (item) => item.id, parentIdProvider: null }
  )
  const graph = await buildGraph({
    nodesSources: [nodesSource],
    edgesSources: [edgesSource],
  })
  const out3 = await analyze(
    { in: graph, labelConfigurations: [labelConfiguration] },
    {
      resultPropertyName: 'louvain',
      clusterCount: 3,
      directed: false,
      analysisMode: 'louvainmodularity',
      subgraphNodes: null,
      subgraphEdges: null,
      edgeWeights: () => 1,
    }
  )
  const out4 = await arrange(out3, {
    layoutStyle: 'organic',
    layoutOrientation: 'top-to-bottom',
    edgeLabeling: true,
    edgeLength: 40,
    nodeDistance: 10,
    edgeGrouping: false,
    compactness: 0.7,
    gridSpacing: 20,
    circularLayoutStyle: 'bcc-compact',
    gridColumns: null,
    gridRows: null,
  })

  return out4
}
