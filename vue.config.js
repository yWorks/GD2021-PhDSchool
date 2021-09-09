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

module.exports = {
  runtimeCompiler: true,
  chainWebpack: config => {
    /** the yFiles library files are ES5 compatible and don't need to be babeled explicitly */
    config.module.rule('js').exclude.add(/es-modules/)

    // cache loader and worker loader don't work well together - exclude worker file from the rule
    config.module.rule('js').exclude.add(/LayoutWorker\.js$/)
    // add worker and babel loader for the worker file
    config.module
        .rule('web-worker')
        .post()
        .test(/LayoutWorker\.js$/)
        .use('worker-loader')
        .loader('worker-loader')
        .end()
        .use('babel-loader')
        .loader('babel-loader')
  }
}
