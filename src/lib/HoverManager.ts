import {
    GraphComponent, GraphEditorInputMode,
    GraphItemTypes,
    HoveredItemChangedEventArgs,
    IEdge,
    IList,
    IModelItem,
    INode,
    ItemHoverInputMode,
    List
} from "yfiles";

export type HoveredItemsChangedListener = (newValue: IModelItem[]) => void

export class HoverManager {
    private readonly graphComponent: GraphComponent
    private readonly listeners: IList<HoveredItemsChangedListener> = new List<HoveredItemsChangedListener>()

    private oldValue: any
    private readonly _getter: (item: IModelItem | null) => any;

    constructor(graphComponent: GraphComponent, getter: ((item: IModelItem | null) => (any))) {
        this.graphComponent = graphComponent;
        this._getter = getter;
    }

    enable() {
        if (this.graphComponent.inputMode instanceof GraphEditorInputMode) {
            const mode = this.graphComponent.inputMode as GraphEditorInputMode
            const hoverInputMode = mode.itemHoverInputMode
            // enable the ItemHoverInputMode and let it handle edges and nodes
            hoverInputMode.enabled = true
            hoverInputMode.hoverItems = GraphItemTypes.NODE | GraphItemTypes.EDGE
            // ignore items of other types which might be in front of them
            hoverInputMode.discardInvalidItems = false
            // handle changes on the hovered items
            hoverInputMode.addHoveredItemChangedListener((sender, args) => this.updateHover(sender, args))
        }
    }

    disable() {
        if (this.graphComponent.inputMode instanceof GraphEditorInputMode) {
            const mode = this.graphComponent.inputMode as GraphEditorInputMode
            const hoverInputMode = mode.itemHoverInputMode
            // enable the ItemHoverInputMode and let it handle edges and nodes
            hoverInputMode.enabled = false
            hoverInputMode.removeHoveredItemChangedListener((sender, args) => this.updateHover(sender, args))
        }
    }

    private updateHover(sender: ItemHoverInputMode, args: HoveredItemChangedEventArgs) {
        const newItem = args.item
        if (newItem instanceof INode) {
            const newNode: INode = newItem as INode
            const newValue = this._getter(newNode)
            if (newValue !== null) {
                if (newValue !== this.oldValue) {
                    this.fireHoveredItemsChangedEvent(this.collectItems(newValue));
                    this.oldValue = newValue
                }
            } else {
                //Just clear all highlights
                this.fireHoveredItemsChangedEvent([])
                this.oldValue = null
            }
        } else {
            if (newItem instanceof IEdge) {
                const newEdge: IEdge = newItem as IEdge
                const newSourceValue = this._getter(newEdge.sourceNode)
                const newTargetValue = this._getter(newEdge.targetNode)
                if (newSourceValue === null || newTargetValue === null || newSourceValue !== newTargetValue) {
                    //Edge between nodes without values or different ones - just clear highlights
                    this.fireHoveredItemsChangedEvent([])
                    this.oldValue = null
                } else {
                    this.fireHoveredItemsChangedEvent(this.collectItems(newSourceValue));
                    this.oldValue = newSourceValue
                }
            } else {
                this.fireHoveredItemsChangedEvent([])
                this.oldValue = null
            }
        }
    }

    private collectItems(value: any): IModelItem[] {
        //Hovered over node with new modularity
        //Highlight nodes with same modularity and all edges between
        return this.graphComponent.graph.nodes.filter((n) => this._getter(n) === value)
            .concat(this.graphComponent.graph.edges.filter((e) => this._getter(e.sourceNode) === value && this._getter(e.targetNode) === value)).toArray()
    }


    /**
     * Registers a listener for item changes
     * @param listener the listener
     */
    addHoveredItemsChanged(listener: HoveredItemsChangedListener): void {
        this.listeners.push(listener)
    }

    /**
     * Unregisters a {@link HoveredItemsChangedListener}.
     * @param listener the listener
     */
    removeHoveredItemsChanged(listener: HoveredItemsChangedListener): void {
        this.listeners.remove(listener)
    }

    private fireHoveredItemsChangedEvent(items: IModelItem[]): void {
        for (const listener of this.listeners) {
            listener(items)
        }
    }
}