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
    WebGL2DefaultLabelStyle, WebGL2FadeAnimationType,
    WebGL2GraphModelManager,
    WebGL2IconLabelStyle,
    WebGL2SelectionIndicatorManager,
    WebGL2ShapeNodeShape,
    WebGL2ShapeNodeStyle,
    WebGL2Stroke
} from "yfiles";

export type RenderModeChangedListener = (newValue: boolean) => void

/**
 * Helper class that encapsulates all WebGL2 support
 */
export class WebGL2Support {
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
    private _isWebGL2Rendering = false

    //Automatic rendering type switching
    private _automaticRenderMode: boolean = false;
    private svgThreshold = 0.2;

    constructor(graphComponent: GraphComponent) {
        this.graphComponent = graphComponent;
        this.unoptimizedModelManager = this.graphComponent.graphModelManager
        this.selectionManager = this.graphComponent.selectionIndicatorManager
    }

    public initialize() {
        this.registerZoomListeners()
    }

    public toggleWebGL2(enable: boolean) {
        if (enable && !this.isWebGL2Rendering) {
            this.isWebGL2Rendering = true
            this.enableWebGL2()
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
        this.graphComponent.graphModelManager = this.unoptimizedModelManager
        this.graphComponent.selectionIndicatorManager = this.selectionManager
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, true))
    }

    /**
     * Enable WebGL2 rendering.
     *
     * This method sets the optimized model and selection manager
     */
    private enableWebGL2() {
        const selectedItems = this.graphComponent.selection.toArray()
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, false))
        const webGL2GraphModelManager = new WebGL2GraphModelManager()
        this.graphComponent.graphModelManager = webGL2GraphModelManager
        this.graphComponent.selectionIndicatorManager = new WebGL2SelectionIndicatorManager(this.graphComponent)
        selectedItems.forEach((item) => this.graphComponent.selection.setSelected(item, true))
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
