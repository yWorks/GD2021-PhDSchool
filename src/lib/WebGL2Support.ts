import {loadIcons} from "@/lib/IconUtils"
import {
    Animator,
    DefaultLabelStyle,
    Font,
    FreeNodeLabelModel,
    GraphComponent,
    GraphEditorInputMode,
    GraphItemTypes,
    GraphModelManager, IAnimation, IEdge,
    ILabel, IList,
    IModelItem, INode, List,
    Point,
    SelectionIndicatorManager,
    Size,
    VoidLabelStyle,
    WebGL2Animation,
    WebGL2DefaultLabelStyle,
    WebGL2FadeAnimationType,
    WebGL2GraphModelManager,
    WebGL2IconLabelStyle,
    WebGL2SelectionIndicatorManager,
    WebGL2ShapeNodeShape,
    WebGL2ShapeNodeStyle,
    WebGL2Stroke
} from "yfiles";
import {LevelOfDetailLabelStyle} from "@/lib/LevelOfDetailLabelStyle";

export enum AnimationType {
    FADE_OUT,
    HIGHLIGHT
}

export type RenderModeChangedListener = (newValue: boolean) => void

/**
 * Helper class that encapsulates all WebGL2 support
 */
export class WebGL2Support {
    get suspend(): boolean {
        return this._suspend;
    }

    set suspend(value: boolean) {
        this._suspend = value;
    }

    get animationType(): AnimationType {
        return this._animationType;
    }

    set animationType(value: AnimationType) {
        this.animator.stop()
        this.clearAnimations()
        this._animationType = value;
    }
    get animator(): Animator {
        return this._animator;
    }

    private readonly _animator: Animator

    private _suspend:boolean = false

    private _animationType:AnimationType = AnimationType.FADE_OUT

    get automaticRenderMode(): boolean {
        return this._automaticRenderMode;
    }

    set automaticRenderMode(value: boolean) {
        this._automaticRenderMode = value;
        if(value) {
            this.toggleWebGL2(this.graphComponent.zoom < this.svgThreshold)
        }
    }

    get isWebGL2Rendering(): boolean {
        return this._isWebGL2Rendering;
    }

    set isWebGL2Rendering(value: boolean) {
        if(this._isWebGL2Rendering !== value) {
            this._isWebGL2Rendering = value;
            this.fireRenderModeChangedEvent(value)
        }
    }

    private readonly graphComponent: GraphComponent
    /** Standard GMM and Selection manager for unoptimized SVG rendering */
    private readonly unoptimizedModelManager!: GraphModelManager
    private readonly selectionManager!: SelectionIndicatorManager<IModelItem>
    private readonly listeners: IList<RenderModeChangedListener> = new List<RenderModeChangedListener>()
    /** Preloaded image data */
    private iconData!: Map<string, ImageData | null>

    /** dummy labels for the flag icons in WebGL */
    private flagLabels: ILabel[] = []
    private _isWebGL2Rendering = false

    //Automatic rendering type switching
    private _automaticRenderMode: boolean = false;
    private svgThreshold = 0.2;

    constructor(graphComponent: GraphComponent) {
        this.graphComponent = graphComponent;
        this.unoptimizedModelManager = this.graphComponent.graphModelManager
        this.selectionManager = this.graphComponent.selectionIndicatorManager
        this._animator = new Animator(graphComponent)
        this.animator.allowUserInteraction = true
    }

    public async initialize() {
        //First preload all icons...
        this.iconData = await loadIcons(this.graphComponent)
        this.registerZoomListeners()
    }

    public toggleWebGL2(enable: boolean) {
        if(this.suspend) {
            return;
        }
        if (enable && !this.isWebGL2Rendering) {
            this.isWebGL2Rendering = true
            this.animator.stop()
            this.clearAnimations()
            if (!this.iconData) {
                loadIcons(this.graphComponent).then((icons:Map<string, ImageData|null>) => {
                    //Wait until icons have been loaded
                    this.iconData = icons
                    this.enableWebGL2(icons);
                })
            } else {
                this.enableWebGL2(this.iconData);
            }
        } else if (!enable && this.isWebGL2Rendering) {
            this.isWebGL2Rendering = false
            this.disableWebGL2();
        }
    }

    /**
     * Disable WebGL2 rendering
     */
    private disableWebGL2() {
        const selectedItems = this.graphComponent.selection.toArray()
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, false))
        this.flagLabels.forEach((l) => this.graphComponent.graph.remove(l))
        this.flagLabels = []
        this.graphComponent.graphModelManager = this.unoptimizedModelManager
        this.graphComponent.selectionIndicatorManager = this.selectionManager
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, true))
    }

    /**
     * Enable WebGL2 rendering.
     *
     * This method sets the optimized model and selection manager and also configures the special WebGL2
     * styles so that they look similar to the SVG ones
     */
    private enableWebGL2(icons: Map<string, ImageData | null>) {
        const selectedItems = this.graphComponent.selection.toArray()
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, false))
        const webGL2GraphModelManager = new WebGL2GraphModelManager()
        this.graphComponent.graphModelManager = webGL2GraphModelManager
        this.graphComponent.selectionIndicatorManager = new WebGL2SelectionIndicatorManager(this.graphComponent)
        this.configureWebGL2Styles(webGL2GraphModelManager, icons)
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, true))
    }

    /**
     * Actually create icon labels for the flags and configure labels and nodes to look more like in SVG rendering
     */
    private configureWebGL2Styles(webGL2GraphModelManager: WebGL2GraphModelManager, icons: Map<string, ImageData | null>) {
        //Adjust the actual labels to look like the SVG ones
        this.graphComponent.graph.nodeLabels.forEach((label) => {
            //Adjust the actual label's appearance to the one in SVG high detail mode
            //Extract the proper font
            let font: Font | null = null
            if (label.style instanceof LevelOfDetailLabelStyle && (<LevelOfDetailLabelStyle>label.style).detailLabelStyle instanceof DefaultLabelStyle) {
                font = (<DefaultLabelStyle>(<LevelOfDetailLabelStyle>label.style).detailLabelStyle).font
            } else {
                if (label.style instanceof DefaultLabelStyle) {
                    const defaultLabelStyle = label.style as DefaultLabelStyle
                    font = defaultLabelStyle.font
                }
            }
            const labelStyle = font ? new WebGL2DefaultLabelStyle({font: font}) : new WebGL2DefaultLabelStyle()
            webGL2GraphModelManager.setStyle(
              label,
              labelStyle
            )
        })

        //add the flag as an icon label
        this.graphComponent.graph.nodes.forEach((node) => {
            const label = node.tag?.label
            if (label) {
                const icon = icons.get(label)
                if (icon) {
                    //If there is an actual icon for the node, create a dummy label
                    //Try to position it at the same place as the original flag
                    const labelSize = new Size(node.layout.width / 2, (node.layout.width / 2) * 0.75)
                    const labelParam = FreeNodeLabelModel.INSTANCE.createParameter({
                        layoutRatio: [0.25, 0.15],
                        layoutOffset: Point.ORIGIN,
                        labelRatio: Point.ORIGIN
                    })
                    //Add the dummy
                    const dummyLabel = this.graphComponent.graph.addLabel({
                        owner: node,
                        preferredSize: labelSize,
                        text: '',
                        style: VoidLabelStyle.INSTANCE,
                        layoutParameter: labelParam
                    })
                    //Use an icon for it
                    webGL2GraphModelManager.setStyle(dummyLabel, new WebGL2IconLabelStyle({icon: icon}))
                    //Remember to clear it later
                    this.flagLabels.push(dummyLabel)
                }
            }
            const color = node.tag?.color
            if (color) {
                //Just use an ellipse for the node itself
                webGL2GraphModelManager.setStyle(
                    node,
                    new WebGL2ShapeNodeStyle({
                        shape: WebGL2ShapeNodeShape.ELLIPSE,
                        fill: color,
                        stroke: new WebGL2Stroke("white", 2)
                    })
                )
            }
        })
    }

    clearAnimations() {
        const graph = this.graphComponent.graph
        if (this.graphComponent.graphModelManager instanceof WebGL2GraphModelManager) {
            const gmm = this.graphComponent.graphModelManager as WebGL2GraphModelManager
            graph.nodes.forEach(node => {
                gmm.setAnimations(node, null)
            })
            graph.edges.forEach(edge => {
                gmm.setAnimations(edge, null)
            })
            graph.labels.forEach(label => {
                gmm.setAnimations(label, null)
            })
        }
    }

    enableAnimations(items: IModelItem[]) {
        if (this.graphComponent.graphModelManager instanceof WebGL2GraphModelManager) {
            const gmm = this.graphComponent.graphModelManager as WebGL2GraphModelManager
            let animation: IAnimation | null = null

            if (this.animationType == AnimationType.FADE_OUT) {
                const webGLAnimation = gmm.createFadeAnimation({
                    fadeType: WebGL2FadeAnimationType.FADE_TO_GRAY,
                    preferredDuration: "500ms"
                })
                animation = webGLAnimation
                const itemMap = new Set()
                items.forEach((n) => itemMap.add(n))

                //Fade out all nodes EXCEPT the highlighted ones, together with adjacent edges and labels
                this.graphComponent.graph.nodes.filter((n) => !itemMap.has(n)).forEach((node) => {
                    gmm.setAnimations(node, [webGLAnimation])
                    node.labels.forEach(label => gmm.setAnimations(label, [webGLAnimation]))
                    this.graphComponent.graph.edgesAt(node).forEach((edge) => gmm.setAnimations(edge, [webGLAnimation]))
                })
            } else {
                const webGLAnimation = gmm.createPulseAnimation({
                    preferredDuration: "5s"
                })
                animation = webGLAnimation
                items.forEach(item => {
                    if (item instanceof INode) {
                        const node = item as INode
                        gmm.setAnimations(node, [webGLAnimation])
                        node.labels.forEach(label => gmm.setAnimations(label, [webGLAnimation]))
                    } else {
                        if (item instanceof IEdge) {
                            const edge = item as IEdge
                            gmm.setAnimations(edge, [webGLAnimation])
                        }
                    }
                })
            }
            if (animation !== null) {
                this.animator.animate(animation)
            }
        }
    }

    /**
     * React to zoom level changes and switch to WebGL2 resp. SVG
     * @private
     */
    private registerZoomListeners() {
        this.graphComponent.addZoomChangedListener((gc, evt) => {
            if (this.automaticRenderMode) {
                this.toggleWebGL2(this.graphComponent.zoom < this.svgThreshold)
            }
        })
    }

    addRenderModeChangeChanged(listener: RenderModeChangedListener): void {
        this.listeners.push(listener)
    }

    /**
     * Unregisters a {@link RenderModeChangedListener}.
     * @param listener the listener
     */
    removeRenderModeChangeChanged(listener: RenderModeChangedListener): void {
        this.listeners.remove(listener)
    }

    private fireRenderModeChangedEvent(webGL2:boolean): void {
        for (const listener of this.listeners) {
            listener(webGL2)
        }
    }
}
