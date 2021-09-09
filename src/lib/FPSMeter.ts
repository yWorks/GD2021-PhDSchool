import { eventBus } from '@/main'
import {GraphComponent} from "yfiles";
export class FPSMeter {
    private _enabled: boolean
    private readonly scale: number
    private frameCache: number[]
    private readonly fpsHistory: number[]
    private readonly cacheSize: number
    private timerId = 0

    /**
     * Initializes a new FPS counter.
     */
    constructor() {
        this.scale = Math.floor(65.0 / 60.0)
        this.frameCache = []
        this.fpsHistory = []
        this._enabled = true
        this.cacheSize = 20
    }

    get enabled(): boolean {
        return this._enabled
    }

    set enabled(value: boolean) {
        this._enabled = value
        if (value) {
            eventBus.$emit('updateFPS', '')
        } else {
            eventBus.$emit('updateFPS', '-')
        }
    }

    /**
     * Calculates and shows the frame rate. To be called once on each new frame.
     */
    showFps(): void {
        if (!this.enabled) {
            return
        }
        const time = new Date().getTime()
        const cache = this.frameCache
        cache.push(time)
        if (cache.length > this.cacheSize) {
            cache.shift()
        } else if (cache.length < 3) {
            // have at least 3 frames to calculate the framerate
            return
        }

        // update the UI periodically
        if (this.timerId === 0) {
            this.timerId = window.setTimeout(() => {
                const d = (cache[cache.length - 1] - cache[0]) * 0.001
                // Depending on the load, yFiles is capable of higher update rates than 60 fps.
                // However, most browsers can render at most 60 fps and to display the actual
                // re-drawing frequency, we limit the displayed fps to 60.
                const fps = Math.min(Math.floor(this.cacheSize / d), 60)
                this.timerId = 0
                eventBus.$emit('updateFPS', fps.toString())

                // visualize fps
                const fpsHist = this.fpsHistory
                fpsHist.push(fps)
                if (fpsHist.length > this.cacheSize) {
                    fpsHist.shift()
                } else if (fpsHist.length < 2) {
                    return
                }
            }, 50)
        }
    }

    /**
     * Resets the internal cached frame times.
     */
    resetFrameArray(): void {
        this.frameCache = []
    }

    registerFPSCounter(graphComponent:GraphComponent) {
        let updated = false
        // continuously reset the frame array every second, except when there were updateVisual calls
        const startFramerateTimer = () => {
            setTimeout(() => {
                if (!updated) {
                    this.resetFrameArray()
                }
                updated = false
                startFramerateTimer()
            }, 1000)
        }
        startFramerateTimer()
        graphComponent.addUpdatedVisualListener(() => {
            this.showFps()
            updated = true
        })
    }
}