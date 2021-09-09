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

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export type HttpRequestConfiguration = {
  url: string
  method: HttpMethod
  body?: string
  basicAuth: boolean
  username?: string
  password?: string
  headers: string
  params: string
}

export type HttpMethod = 'GET' | 'POST'

export async function httpRequest(
  configuration: HttpRequestConfiguration
): Promise<string> {
  if (configuration.url === '') {
    return ''
  }

  const request = await buildRequest(configuration)

  let response: AxiosResponse
  try {
    response = await axios(request)
  } catch (e) {
    if (e.response) {
      throw new Error(
        `Could not fetch ${configuration.url}. Status Code: ${e.response.status} - ${e.response.statusText}`
      )
    }
    throw new Error(`Could not fetch ${configuration.url}. ${e}`)
  }

  if (response.status !== 200) {
    throw new Error(
      `Could not fetch ${configuration.url}. Status Code: ${response.status} - ${response.statusText}`
    )
  }

  return response.data
}

function buildRequest(configuration: HttpRequestConfiguration) {
  const request: AxiosRequestConfig = {
    url: configuration.url,
    method: configuration.method,
    responseType: 'text',
    transformResponse: (data) => data, // axios calls JSON.parse per default here
    headers: parseHeaders(configuration.headers),
    params: parseHeaders(configuration.params),
  }

  if (configuration.method === 'POST') {
    request.data = configuration.body
  }

  addAuthentication(request, configuration)
  return request
}

function addAuthentication(
  request: AxiosRequestConfig,
  configuration: HttpRequestConfiguration
) {
  if (configuration.basicAuth && configuration.username) {
    request.auth = {
      password: configuration.password || '',
      username: configuration.username,
    }
  }
}

function parseHeaders(value: string) {
  return value
    .split(/\r?\n/g)
    .reduce((headerObject: Record<string, string>, header) => {
      const match = header.match(/^([^:=]+)[:=]\s*(.*)$/)
      if (match) {
        const [_, name, value] = match
        headerObject[name] = value
      }
      return headerObject
    }, {})
}
