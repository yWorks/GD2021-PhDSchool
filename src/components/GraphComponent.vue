<!-- ////////////////////////////////////////////////////////////////////////
     // @license
     // This app exhibits yFiles for HTML functionalities.
     // Copyright (c) 2021 by yWorks GmbH, Vor dem Kreuzberg 28,
     // 72070 Tuebingen, Germany. All rights reserved.
     // 
     // yFiles demo files exhibit yFiles for HTML functionalities.
     // Any redistribution of demo files in source code or binary form, with
     // or without modification, is not permitted.
     // 
     // Owners of a valid software license for a yFiles for HTML
     // version are allowed to use the app source code as basis for their
     // own yFiles for HTML powered applications. Use of such programs is
     // governed by the rights and conditions as set out in the yFiles for HTML
     // license agreement. If in doubt, please mail to contact@yworks.com.
     // 
     // THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
     // WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
     // MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
     // NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
     // SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
     // TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
     // PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
     // LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     // NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     // SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     // 
     ////////////////////////////////////////////////////////////////////////-->

<template>
  <!-- a container that is used by yFiles -->
  <div id="graph-component">
    <ContextMenu @populate-context-menu="currentItem = $event">
      <button
        v-for="action in contextMenuActions"
        :key="action.title"
        @click="action.action()"
        v-text="action.title"
      ></button>
    </ContextMenu>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Vue } from 'vue-property-decorator'
import { eventBus } from '@/main'
import {
  GraphComponent,
  GraphEditorInputMode,
  GraphInputMode,
  GraphItemTypes,
  GraphMLSupport,
  ICommand,
  IEdge,
  IModelItem,
  INode,
  License,
  Point,
  StorageLocation,
  TimeSpan,
} from 'yfiles'
import loadGraph from '../lib/loadGraph'
import licenseData from '../license.json'
import Tooltip from './Tooltip.vue'
import { ExportFormat, ExportSupport } from '../lib/ExportSupport'
import {
  VuejsNodeStyle,
  VuejsNodeStyleMarkupExtension,
} from '../lib/VuejsNodeStyle'
import ContextMenu from '../components/ContextMenu.vue'
import GraphSearch from '../lib/GraphSearch'
import {FPSMeter} from "@/lib/FPSMeter"

License.value = licenseData

@Component({ components: { ContextMenu } })
export default class extends Vue {
  private graphComponent!: GraphComponent

  private graphSearch!: GraphSearch
  private $query!: string
  private mainFrameRate!: FPSMeter
  
  contextMenuActions: { title: string; action: () => void }[] = [
    {
      title: 'Context Menu',
      action: () => alert('Context menu entry clicked!'),
    },
  ]

  @Inject('yFilesAPI') private yFilesAPI!: { getGC: () => GraphComponent }

  beforeMount() {
    this.yFilesAPI.getGC = () => this.graphComponent || null
  }

  async mounted() {
    // instantiate a new GraphComponent
    this.graphComponent = new GraphComponent('#graph-component')

    this.graphComponent.inputMode = this.configureInput()
    this.mainFrameRate = new FPSMeter()
    this.mainFrameRate.registerFPSCounter(this.graphComponent)
    
    this.graphComponent.graph = await loadGraph()

    this.graphComponent.graph.undoEngineEnabled = true
    this.enableGraphML()
    this.initializeTooltips()
    this.graphSearch = new GraphSearch(this.graphComponent)
    this.graphComponent.graph.addNodeCreatedListener(
      this.updateSearch.bind(this)
    )
    this.graphComponent.graph.addNodeRemovedListener(
      this.updateSearch.bind(this)
    )
    this.graphComponent.graph.addLabelAddedListener(
      this.updateSearch.bind(this)
    )
    this.graphComponent.graph.addLabelRemovedListener(
      this.updateSearch.bind(this)
    )
    this.graphComponent.graph.addLabelTextChangedListener(
      this.updateSearch.bind(this)
    )

    this.registerToolbarEvents()

    // center the newly created graph
    this.graphComponent.fitGraphBounds()
  }

  private configureInput():GraphEditorInputMode {
    //Configure input to better match our requirements
    this.graphComponent.focusIndicatorManager.enabled = false

    const graphEditorInputMode = new GraphEditorInputMode();
    //Disallow bend creation and don't show bend handles
    graphEditorInputMode.showHandleItems = GraphItemTypes.NODE | GraphItemTypes.PORT
    graphEditorInputMode.allowCreateBend = false
    //Allow selection and click only for nodes
    graphEditorInputMode.marqueeSelectableItems = GraphItemTypes.NODE
    graphEditorInputMode.selectableItems = GraphItemTypes.NODE
    graphEditorInputMode.clickableItems = GraphItemTypes.NODE
    //Disallow node creation and deletion
    graphEditorInputMode.allowCreateNode = false
    graphEditorInputMode.deletableItems = GraphItemTypes.NONE
    graphEditorInputMode.allowEditLabel = false
    return graphEditorInputMode
  }

  private registerToolbarEvents() {
    eventBus.$on('zoom-in', () => {
      ICommand.INCREASE_ZOOM.execute(null, this.graphComponent)
    })
    eventBus.$on('zoom-out', () => {
      ICommand.DECREASE_ZOOM.execute(null, this.graphComponent)
    })
    eventBus.$on('zoom-fit', () => {
      ICommand.FIT_GRAPH_BOUNDS.execute(null, this.graphComponent)
    })
    eventBus.$on('clear', () => {
      this.graphComponent.graph.clear()
      ICommand.FIT_GRAPH_BOUNDS.execute(null, this.graphComponent)
    })
    eventBus.$on('undo', () => {
      ICommand.UNDO.execute(null, this.graphComponent)
    })
    eventBus.$on('redo', () => {
      ICommand.REDO.execute(null, this.graphComponent)
    })
    eventBus.$on('export', (format: ExportFormat) => {
      // export the graph of the current view
      const graph = this.graphComponent.graph

      if (graph.nodes.size === 0) {
        return
      }

      this.graphComponent.updateContentRect(30)
      const exportArea = this.graphComponent.contentRect
      switch (format) {
        case ExportFormat.SVG:
          ExportSupport.saveSvg(graph, exportArea, 1)
          break
        case ExportFormat.PNG:
          ExportSupport.savePng(graph, exportArea, 1)
          break
        case ExportFormat.PDF:
          ExportSupport.savePdf(graph, exportArea, 1)
          break
      }
    })
    eventBus.$on('open', () => {
      ICommand.OPEN.execute(null, this.graphComponent)
    })

    eventBus.$on('save', () => {
      ICommand.SAVE.execute(null, this.graphComponent)
    })
    eventBus.$on('search-query-input', (query: string) => {
      this.$query = query
      this.updateSearch()
    })
  }

  /**
   * Dynamic tooltips are implemented by adding a tooltip provider as an event handler for
   * the {@link MouseHoverInputMode#addQueryToolTipListener QueryToolTip} event of the
   * GraphInputMode using the
   * {@link ToolTipQueryEventArgs} parameter.
   * The {@link ToolTipQueryEventArgs} parameter provides three relevant properties:
   * Handled, QueryLocation, and ToolTip. The Handled property is a flag which indicates
   * whether the tooltip was already set by one of possibly several tooltip providers. The
   * QueryLocation property contains the mouse position for the query in world coordinates.
   * The tooltip is set by setting the ToolTip property.
   */
  private initializeTooltips() {
    const inputMode = this.graphComponent.inputMode as GraphInputMode

    // show tooltips only for nodes
    inputMode.toolTipItems = GraphItemTypes.NODE

    // Customize the tooltip's behavior to our liking.
    const mouseHoverInputMode = inputMode.mouseHoverInputMode
    mouseHoverInputMode.toolTipLocationOffset = new Point(15, 15)
    mouseHoverInputMode.delay = TimeSpan.fromMilliseconds(500)
    mouseHoverInputMode.duration = TimeSpan.fromSeconds(5)

    // Register a listener for when a tooltip should be shown.
    inputMode.addQueryItemToolTipListener((src, eventArgs) => {
      if (eventArgs.handled) {
        // Tooltip content has already been assigned -> nothing to do.
        return
      }

      // Use a rich HTML element as tooltip content. Alternatively, a plain string would do as well.
      eventArgs.toolTip = this.createTooltipContent(eventArgs.item!)

      // Indicate that the tooltip content has been set.
      eventArgs.handled = true
    })
  }

  /**
   * The tooltip may either be a plain string or it can also be a rich HTML element. In this case, we
   * show the latter by using a dynamically compiled Vue component.
   * @param {IModelItem} item
   * @returns {HTMLElement}
   */
  private createTooltipContent(item: IModelItem): HTMLElement {
    const vueTooltipComponent = Vue.extend(Tooltip)

    const vueTooltip = new vueTooltipComponent({
      data: {
        title: 'Node data:',
        content: item.tag.label,
      },
    })

    vueTooltip.$mount()

    return vueTooltip.$el as HTMLElement
  }

  /**
   * Enables loading and saving the graph to GraphML.
   */
  private enableGraphML() {
    // Create a new GraphMLSupport instance that handles save and load operations.
    // This is a convenience layer around the core GraphMLIOHandler class
    // that does all the heavy lifting. It adds support for commands at the GraphComponent level
    // and file/loading and saving capabilities.
    const graphMLSupport = new GraphMLSupport({
      graphComponent: this.graphComponent,
      // configure to load and save to the file system
      storageLocation: StorageLocation.FILE_SYSTEM,
    })
    const graphmlHandler = graphMLSupport.graphMLIOHandler

    // needed when the VuejsNodeStyle was chosen in the NodeCreator of the GraphBuilder
    graphmlHandler.addXamlNamespaceMapping(
      'http://www.yworks.com/demos/yfiles-vuejs-node-style/1.0',
      'VuejsNodeStyle',
      VuejsNodeStyleMarkupExtension.$class
    )
    graphmlHandler.addNamespace(
      'http://www.yworks.com/demos/yfiles-vuejs-node-style/1.0',
      'VuejsNodeStyle'
    )

    graphmlHandler.addHandleSerializationListener((sender, args) => {
      const item = args.item
      const context = args.context
      if (item instanceof VuejsNodeStyle) {
        const vuejsNodeStyleMarkupExtension = new VuejsNodeStyleMarkupExtension()
        vuejsNodeStyleMarkupExtension.template = item.template
        context.serializeReplacement(
          VuejsNodeStyleMarkupExtension.$class,
          item,
          vuejsNodeStyleMarkupExtension
        )
        args.handled = true
      }
    })
  }

  private updateSearch() {
    this.graphSearch.updateSearch(this.$query)
  }
}
</script>

<style scoped>
/* yfiles.css is an integral part of the library and must be loaded wherever a yFiles GraphComponent is created */
@import '~yfiles/yfiles.css';

#graph-component {
  width: 100%;
  height: 100%;
}
</style>

<style>
.yfiles-tooltip {
  border: initial;
  padding: initial;
}
</style>
