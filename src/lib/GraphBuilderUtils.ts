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
  DefaultLabelStyle,
  Fill,
  FillConvertible,
  FreeNodeLabelModel,
  ILabelModelParameter,
  InteriorLabelModel,
  LabelCreator,
  NinePositionsEdgeLabelModel,
  ObjectBindings,
  Point
} from 'yfiles'

export enum LabelPlacement {
  /*
   * Do not change case of enum values. they are used for string comparison
   * with "toLowerCase", method asLayoutParameter
   */

  // node values (used for bound node label placement and text node _and_ edge label placement)
  TopLeft = 'topleft',
  Top = 'top',
  TopRight = 'topright',
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Bottom = 'bottom',
  BottomLeft = 'bottomleft',
  BottomRight = 'bottomright',

  // edge values (used for bound edge label placement)
  SourceAbove = 'sourceabove',
  CenteredAbove = 'centeredabove',
  TargetAbove = 'targetabove',
  SourceCentered = 'sourcecentered',
  CenterCentered = 'centercentered',
  TargetCentered = 'targetcentered',
  SourceBelow = 'sourcebelow',
  CenteredBelow = 'centeredbelow',
  TargetBelow = 'targetbelow',
}

export function asLayoutParameterForNodes(placement: string) {
  if (!placement) {
    return InteriorLabelModel.CENTER
  }
  placement.replace('_', '')
  switch (placement.toLowerCase()) {
    case LabelPlacement.TopLeft:
      return InteriorLabelModel.NORTH_WEST
    case LabelPlacement.Top:
      return InteriorLabelModel.NORTH
    case LabelPlacement.TopRight:
      return InteriorLabelModel.NORTH_EAST
    case LabelPlacement.Left:
      return InteriorLabelModel.WEST
    case LabelPlacement.Center:
      return InteriorLabelModel.CENTER
    case LabelPlacement.Right:
      return InteriorLabelModel.EAST
    case LabelPlacement.BottomLeft:
      return InteriorLabelModel.SOUTH_WEST
    case LabelPlacement.Bottom:
      return InteriorLabelModel.SOUTH
    case LabelPlacement.BottomRight:
      return InteriorLabelModel.SOUTH_EAST
    default:
      //We interpret this as a specification for the FreeNodeLabelModel, with the label centered on the given relative locations
      //@ts-ignore
      return FreeNodeLabelModel.INSTANCE.createParameter(JSON.parse(placement), Point.ORIGIN, new Point(0.5, 0.5))
  }
}

export function asLayoutParameterForEdges(placement: string) {
  if (!placement) {
    return NinePositionsEdgeLabelModel.CENTER_BELOW
  }
  placement.replace('_', '')
  switch (placement.toLowerCase()) {
    case LabelPlacement.TopLeft:
    case LabelPlacement.SourceAbove:
      return NinePositionsEdgeLabelModel.SOURCE_ABOVE
    case LabelPlacement.CenteredAbove:
    case LabelPlacement.Top:
      return NinePositionsEdgeLabelModel.CENTER_ABOVE
    case LabelPlacement.TargetAbove:
    case LabelPlacement.TopRight:
      return NinePositionsEdgeLabelModel.TARGET_ABOVE
    case LabelPlacement.SourceCentered:
    case LabelPlacement.Left:
      return NinePositionsEdgeLabelModel.SOURCE_CENTERED
    case LabelPlacement.CenterCentered:
    case LabelPlacement.Center:
      return NinePositionsEdgeLabelModel.CENTER_CENTERED
    case LabelPlacement.TargetCentered:
    case LabelPlacement.Right:
      return NinePositionsEdgeLabelModel.TARGET_CENTERED
    case LabelPlacement.SourceBelow:
    case LabelPlacement.BottomLeft:
      return NinePositionsEdgeLabelModel.SOURCE_BELOW
    case LabelPlacement.CenteredBelow:
    case LabelPlacement.Bottom:
      return NinePositionsEdgeLabelModel.CENTER_BELOW
    case LabelPlacement.TargetBelow:
    case LabelPlacement.BottomRight:
      return NinePositionsEdgeLabelModel.TARGET_BELOW
    default:
      return NinePositionsEdgeLabelModel.CENTER_BELOW
  }
}

export type LabelConfiguration<T> = {
  labelsBinding: ((dataItem: T) => any) | null
  textBinding: ((dataItem: any) => string | null) | null
  placement: ((dataItem: any) => string) | null
  fill: ((dataItem: any) => Fill | FillConvertible) | null
}

export function configureLabelCreator<T>(
  labelConfiguration: LabelConfiguration<T>,
  labelCreator: LabelCreator<T>,
  layoutParameterProvider: (placement: string) => ILabelModelParameter
) {
  labelCreator.defaults.style = new DefaultLabelStyle()
  labelCreator.defaults.shareStyleInstance = false

  const placementBinding = labelConfiguration.placement
  if (placementBinding) {
    labelCreator.layoutParameterProvider = (item: T) => {
      return layoutParameterProvider(placementBinding(item))
    }
  }
  maybeAddBinding(
    labelCreator.styleBindings,
    'textFill',
    labelConfiguration.fill
  )
}

export function maybeAddBinding(
  bindings: ObjectBindings<unknown>,
  propertyName: string = 'fill',
  provider: ((dataItem: any) => unknown) | any
): void {
  if (provider) {
    bindings.addBinding(propertyName, provider)
  }
}
