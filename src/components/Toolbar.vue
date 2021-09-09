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
  <div class="toolbar">
    <button
      @click="clear"
      title="Clear Diagram"
      class="demo-icon-yIconNew"
    ></button>
    <span class="separator"></span>

    <button
      @click="open"
      title="Open GraphML file"
      class="demo-icon-yIconOpen"
    ></button>
    <button
      @click="save"
      title="Save GraphML file"
      class="demo-icon-yIconSave"
    ></button>
    <span class="separator"></span>

    <button @click="exportDiagram('svg')" title="Export as SVG" class="labeled">
      SVG
    </button>
    <button @click="exportDiagram('png')" title="Export as PNG" class="labeled">
      PNG
    </button>
    <button @click="exportDiagram('pdf')" title="Export as PDF" class="labeled">
      PDF
    </button>
    <span class="separator"></span>

    <button @click="undo" title="Undo" class="demo-icon-yIconUndo"></button>
    <button @click="redo" title="Redo" class="demo-icon-yIconRedo"></button>
    <span class="separator"></span>

    <button
      @click="zoomIn"
      title="Increase Zoom"
      class="demo-icon-yIconZoomIn"
    ></button>
    <button
      @click="zoomOut"
      title="Decrease Zoom"
      class="demo-icon-yIconZoomOut"
    ></button>
    <button
      @click="zoomFit"
      title="Fit Graph Bounds"
      class="demo-icon-yIconZoomFit"
    ></button>
    <span class="separator"></span>
    <span class="labeled">Rendering Mode: </span>
    <toggle-button @change="toggleWebGL" :labels="{checked: 'WebGL2', unchecked: 'SVG'}" :width="70"/>
    <span class="labeled">Automatic Render Mode: </span>
    <toggle-button @change="toggleAutoWebGL" :labels="true" :width="70"/>

    <span class="spacer"></span>
    <input
      v-model.trim="searchString"
      class="search"
      placeholder="Search Nodes"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { eventBus } from '@/main'
import { ExportFormat } from '../lib/ExportSupport'

@Component
export default class Toolbar extends Vue {
  private fps = 0

  async mounted() {
    eventBus.$on('updateFPS', (fps:number) => {this.fps = fps})
  }

  private searchString = ''

  @Watch('searchString')
  onSearchInput(query: string) {
    eventBus.$emit('search-query-input', query)
  }

  private zoomIn() {
    eventBus.$emit('zoom-in')
  }

  private zoomOut() {
    eventBus.$emit('zoom-out')
  }

  private zoomFit() {
    eventBus.$emit('zoom-fit')
  }

  private clear() {
    eventBus.$emit('clear')
  }

  private undo() {
    eventBus.$emit('undo')
  }

  private redo() {
    eventBus.$emit('redo')
  }
  private open() {
    eventBus.$emit('open')
  }

  private save() {
    eventBus.$emit('save')
  }

  private toggleWebGL(evt:any) {
    eventBus.$emit('toggleWebGL', evt.value)
  }

  private toggleAutoWebGL(evt:any) {
    eventBus.$emit('toggleAutoWebGL', evt.value)
  }

  private exportDiagram(format: 'svg' | 'png' | 'pdf') {
    let exportFormat = ExportFormat.SVG
    if (format === 'png') {
      exportFormat = ExportFormat.PNG
    } else if (format === 'pdf') {
      exportFormat = ExportFormat.PDF
    }
    eventBus.$emit('export', exportFormat)
  }
}
</script>

<style scoped lang="scss">
@import '../assets/icons/icons.css';
.separator {
  height: 24px;
  width: 1px;
  min-width: 1px;
  background: white;
  opacity: 0.5;
  display: inline-block;
  margin: 0 8px;
}

.spacer {
  flex-grow: 1;
}

.toolbar {
  display: flex;
  align-items: center;
  width: 100%;
  button {
    display: inline-block;
    outline: none;
    border: none;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-color: transparent;
    background-size: 20px;
    height: 48px;
    width: 48px;
    line-height: 24px;
    box-sizing: border-box;
    padding: 0;
    cursor: pointer;
    &:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }
  }
  .labeled {
    color: white;
  }
}

.search {
  line-height: 20px;
  padding: 8px;
  font-size: 16px;
  letter-spacing: normal;
  width: 300px;
  &:focus {
    outline: none;
  }
}
</style>
