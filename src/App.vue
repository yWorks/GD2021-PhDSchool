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
  <div id="app">
    <user-input-dialog></user-input-dialog>
    <div class="header">
      <div class="title">PhD School</div>
      <toolbar></toolbar>
    </div>
    <div class="main">
      <graph-component ref="graphComponent"></graph-component>
    </div>
    <div style="position: absolute; bottom: 20px; right: 15px">
      <a href="https://yworks.com" target="_blank" style="margin: 10px">
        <img src="./assets/yWorksLogo.png" style="height: 50px; width: 50px" />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Provide, Vue } from 'vue-property-decorator'
import GraphComponent from './components/GraphComponent.vue'
import Toolbar from './components/Toolbar.vue'
import UserInputDialog from './components/UserInputDialog.vue'

@Component({
  components: {
    GraphComponent,
    Toolbar,
    UserInputDialog,
  },
})
export default class App extends Vue {
  $refs!: {
    graphComponent: any
  }

  @Provide('yFilesAPI')
  private yFilesAPI: { getGC: () => GraphComponent } = {
    getGC: () => this.$refs.graphComponent.graphComponent,
  }
}
</script>

<style scoped>
#app {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background-color: #1976d2;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
}
.main {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 0;
}
.title {
  flex: 0 0 auto;
  color: #FFFFFF;
  margin-right: 32px;
  font-size: 1.25rem;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
