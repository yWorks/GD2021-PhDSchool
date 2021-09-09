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
  <div
    v-show="isDialogOpen"
    class="user-input-container"
    style="position: absolute; top: 20%; left: 20%; z-index: 100"
  >
    <div class="user-input-title">
      User Input
      <div class="spacer" />
    </div>
    <div class="user-input-text">
      <p>{{ query }}</p>
      <form @submit.prevent="submit">
        <div class="user-input">
          <input :placeholder="placeholder" v-model="value" type="text" />
        </div>
      </form>
    </div>
    <div class="user-input-actions">
      <div class="spacer"></div>
      <button type="button" class="user-input-button" @click="cancel">
        Cancel
      </button>
      <button type="button" class="user-input-button" @click="submit">
        Submit
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { eventBus } from '@/main'

@Component
export default class UserInputDialog extends Vue {
  static readonly ID = 'dialog.user-input'

  static readonly open = async function (
    query: string,
    defaultText: string,
    placeholder: string
  ): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      eventBus.$emit(UserInputDialog.ID, {
        query,
        defaultText,
        placeholder,
        resolve,
      })
    })
  }

  private $promise: Promise<string | null> | null = null
  private $resolve: ((value: string | null) => void) | null = null

  private isDialogOpen = false

  private query = ''
  private value = ''
  private placeholder = ''
  private resolve: ((value: string) => void) | null = null

  created() {
    eventBus.$on(
      UserInputDialog.ID,
      ({
        query,
        defaultText,
        placeholder,
        resolve,
      }: {
        query: string
        defaultText: string
        placeholder: string
        resolve: (value: string | null) => void
      }) => {
        if (this.query !== query) {
          this.cancel()
        }
        if (this.$promise) {
          this.isDialogOpen = true
          this.$promise.then(resolve)
        } else {
          this.open(query, defaultText, placeholder).then(resolve)
        }
        this.resolve = resolve
      }
    )
  }

  private open(
    query: string,
    defaultText: string,
    placeholder: string
  ): Promise<string | null> {
    this.query = query
    this.value = defaultText
    this.placeholder = placeholder
    this.isDialogOpen = true
    if (!this.$promise) {
      this.$promise = new Promise((resolve) => {
        this.$resolve = resolve
      })
    }
    return this.$promise
  }

  private commit(s: string) {
    if (this.$resolve) {
      this.$resolve(s)
    }
    this.$promise = null
    this.$resolve = null
  }

  private submit() {
    this.commit(this.value)
    this.isDialogOpen = false
  }

  private cancel() {
    this.commit('')
    this.isDialogOpen = false
  }
}
</script>

<style scoped>
.user-input-container {
  display: flex;
  flex-direction: column;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
  width: 520px;
  height: auto;
  background-color: white;
}

.user-input-title {
  padding: 5px;
  display: flex;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 2rem;
  letter-spacing: 0.0125em;
  font-family: 'Roboto', sans-serif;
  color: #fff;
  background-color: #1976d2;
  border-radius: 4px 4px 0 0;
}

.spacer {
  flex-grow: 1 !important;
}

.user-input-text {
  padding: 0 10px;
  font-size: 1rem !important;
  font-weight: bold;
  line-height: 1.5rem;
  letter-spacing: 0.03125em !important;
  font-family: 'Roboto', sans-serif !important;
  text-align: start;
}

.user-input {
  align-items: flex-start;
  display: flex;
  flex: 1 1 auto;
  font-size: 16px;
  letter-spacing: normal;
  max-width: 100%;
  text-align: left;
  padding-top: 12px;
  margin-top: 4px;
  border-bottom: solid #1976d2;
}

input {
  width: 100%;
  font-size: 16px;
  display: inline-block;
  text-align: start;
  appearance: auto;
  padding: 1px 2px;
  border-width: 2px;
  border-style: none;
  border-image: initial;
}

textarea:focus,
input:focus {
  outline: none;
}

.user-input-actions {
  align-items: center;
  display: flex;
  padding: 8px;
}

.user-input-button {
  align-items: center;
  border-radius: 4px;
  display: inline-flex;
  flex: 0 0 auto;
  font-weight: bold;
  color: white;
  letter-spacing: 0.0892857143em;
  justify-content: center;
  outline: 0;
  position: relative;
  text-transform: uppercase;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;
  height: 36px;
  min-width: 64px;
  padding: 0 16px;
  font-size: 0.875rem;
  margin-left: 8px;
  background-color: #1976d2;
  border-style: none;
  cursor: pointer;
}
</style>
