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
  <div>
    <div
      v-if="showMenu"
      class="context-menu"
      :style="`top: ${positionY}px; left: ${positionX}px;`"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { detectiOSVersion, detectSafariVersion } from '@/lib/Workarounds'
import Vue from 'vue'
import { GraphComponent, GraphInputMode } from 'yfiles'
import { Inject, Component } from 'vue-property-decorator'

function getCenterInPage(element: HTMLElement): { x: number; y: number } {
  let left = element.clientWidth / 2.0
  let top = element.clientHeight / 2.0
  while (element.offsetParent) {
    left += element.offsetLeft
    top += element.offsetTop
    element = element.offsetParent as HTMLElement
  }
  return { x: left, y: top }
}

@Component({
  watch: {
    showMenu: function (val) {
      // @ts-ignore
      if (!val && this.$inputMode) {
        // @ts-ignore
        this.$inputMode.contextMenuInputMode.menuClosed()
      }
    },
  },
})
export default class ContextMenu extends Vue {
  private static readonly KEYCODE_CONTEXTMENU: number = 93
  private positionX: number = 0
  private positionY: number = 0
  private showMenu: boolean = false

  private $inputMode!: GraphInputMode

  @Inject('yFilesAPI') private yFilesAPI!: { getGC: () => GraphComponent }

  mounted() {
    setTimeout(() => {
      if (this.yFilesAPI && this.yFilesAPI.getGC) {
        this.register(this.yFilesAPI.getGC())
      }
    }, 20)
  }

  private register(graphComponent: GraphComponent): void {
    this.$inputMode = graphComponent.inputMode as GraphInputMode
    this.addOpeningEventListeners(graphComponent, (location) => {
      const worldLocation = graphComponent.toWorldFromPage(location)
      const showMenu = this.$inputMode.contextMenuInputMode.shouldOpenMenu(
        worldLocation
      )
      if (showMenu) {
        this.openMenu(location)
      }
    })

    this.$inputMode.contextMenuInputMode.addPopulateMenuListener(
      (sender, evt) => {
        evt.showMenu = true
      }
    )

    this.$inputMode.addPopulateItemContextMenuListener(
      (sender, args) =>
        args.item &&
        args.item.tag &&
        this.$emit('populate-context-menu', args.item.tag)
    )
    this.$inputMode.contextMenuInputMode.addCloseMenuListener(() => this.hide())
  }

  hide(): void {
    this.showMenu = false
  }

  openMenu(location: { x: number; y: number }): void {
    this.showMenu = true
    this.positionX = location.x
    this.positionY = location.y
  }

  private addOpeningEventListeners(
    graphComponent: GraphComponent,
    openingCallback: ({ x, y }: { x: number; y: number }) => void
  ) {
    const componentDiv = graphComponent.div
    const contextMenuListener = (evt: MouseEvent) => {
      evt.preventDefault()
      if (this.showMenu) {
        // might be open already because of the longpress listener
        return
      }
      const me = evt
      if ((evt as any).mozInputSource === 1 && me.button === 0) {
        // This event was triggered by the context menu key in Firefox.
        // Thus, the coordinates of the event point to the lower left corner of the element and should be corrected.
        openingCallback(getCenterInPage(componentDiv))
      } else if (me.pageX === 0 && me.pageY === 0) {
        // Most likely, this event was triggered by the context menu key in IE.
        // Thus, the coordinates are meaningless and should be corrected.
        openingCallback(getCenterInPage(componentDiv))
      } else {
        openingCallback({ x: me.pageX, y: me.pageY - 48 })
      }
    }

    // Listen for the contextmenu event
    // Note: On Linux based systems (e.g. Ubuntu), the contextmenu event is fired on mouse down
    // which triggers the ContextMenuInputMode before the ClickInputMode. Therefore handling the
    // event, will prevent the ItemRightClicked event from firing.
    // For more information, see https://docs.yworks.com/yfileshtml/#/kb/article/780/
    componentDiv.addEventListener('contextmenu', contextMenuListener, false)

    if (detectSafariVersion() > 0 || detectiOSVersion() > 0) {
      // Additionally add a long press listener especially for iOS, since it does not fire the contextmenu event.
      let contextMenuTimer: ReturnType<typeof setTimeout> | undefined
      graphComponent.addTouchDownListener((sender, args) => {
        contextMenuTimer = setTimeout(() => {
          openingCallback(
            graphComponent.toPageFromView(
              graphComponent.toViewCoordinates(args.location)
            )
          )
        }, 500)
      })
      graphComponent.addTouchUpListener(() => {
        clearTimeout(contextMenuTimer!)
      })
    }

    // Listen to the context menu key to make it work in Chrome
    componentDiv.addEventListener('keyup', (evt) => {
      if (evt.keyCode === ContextMenu.KEYCODE_CONTEXTMENU) {
        evt.preventDefault()
        openingCallback(getCenterInPage(componentDiv))
      }
    })
  }
}
</script>

<style scoped lang="scss">
.context-menu {
  position: absolute;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14),
    0 1px 10px 0 rgba(0, 0, 0, 0.12);
  button {
    padding: 4px 8px;
    font-weight: 500;
    font-family: Roboto, sans-serif;
  }
}
</style>
