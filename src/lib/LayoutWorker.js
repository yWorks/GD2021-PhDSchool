/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.4.0.3.
 ** Copyright (c) 2000-2021 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/

import licenseData from '../license.json'
License.value = licenseData

import {
  LayoutExecutorAsyncWorker,
  OrganicLayout,
  License,
  MinimumNodeSizeStage,
  EdgeBundlingStage, CircularLayout, InterleavedMode
} from 'yfiles'

function applyLayout(graph, layoutDescriptor) {

    let coreLayout
    if (layoutDescriptor.name === 'UserDefined') {
        //Unwrap the core Layout first
        coreLayout = createCoreLayout(graph, layoutDescriptor.properties.coreDescriptor)
        if(layoutDescriptor.properties.useEdgeBundling) {
          const bundlingProperties = layoutDescriptor.properties.edgeBundlingProperties
          const edgeBundlingStage = new EdgeBundlingStage(coreLayout);
          edgeBundlingStage.maximumDuration = bundlingProperties.maximumDuration
          edgeBundlingStage.edgeBundling.bundlingStrength = bundlingProperties.bundlingStrength
          coreLayout = edgeBundlingStage
        }
    }
    else {
      coreLayout = createCoreLayout(graph, layoutDescriptor)
    }
    if(coreLayout) {
      // wrap coreLayout it in a MinimumNodeSizeStage
      const layout = new MinimumNodeSizeStage(coreLayout)
      //and apply it
      layout.applyLayout(graph)
    }
}

function createCoreLayout(graph, coreProperties) {
  if (coreProperties.name === 'OrganicLayout') {
    // create and apply a new organic layout using the given layout properties
    return new OrganicLayout(coreProperties.properties)
  }
  if (coreProperties.name === 'CircularLayout') {
    // create and apply a new circular layout using the given layout properties, as well as some we can define only here
    const circularLayout = new CircularLayout(coreProperties.properties)
    circularLayout.singleCycleLayout.minimumNodeDistance = 30
    circularLayout.balloonLayout.compactnessFactor = 0.9
    circularLayout.balloonLayout.minimumEdgeLength = 5
    circularLayout.balloonLayout.preferredChildWedge = 359
    circularLayout.balloonLayout.allowOverlaps = true
    circularLayout.balloonLayout.interleavedMode = InterleavedMode.ALL_NODES
    return circularLayout
  }
}

self.addEventListener(
    'message',
    e => {
        // create a new remote layout executor
        const executor = new LayoutExecutorAsyncWorker(applyLayout)
        executor
            .process(e.data)
            .then(postMessage)
            .catch(postMessage)
    },
    false
)
