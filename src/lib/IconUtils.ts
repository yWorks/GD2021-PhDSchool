/**
 * Load all icons from a (remote) resource and store them in a cache
 */
import {GraphComponent, Size} from "yfiles";

export async function loadIcons(graphComponent: GraphComponent): Promise<Map<string, ImageData | null>> {
    const iconSize = new Size(128, 96)
    const ctx = createCanvasContext(iconSize)
    const retval = new Map<string, ImageData | null>()
    for (const node of graphComponent.graph.nodes) {
        const label = node.tag.label
        if (!retval.has(label)) {
            const url = 'https://yworks-live3.com/phd-school/flags/' + node.tag.label + '.svg'
            const icon = await createUrlIcon(ctx, url, iconSize, iconSize)
            retval.set(label, icon)
        }
    }
    return retval
}

/**
 * Load a single icon to make it usable with WebGL.
 *
 * The image has to be prerendered on a canvas and then the imaga data can be used (internally)
 * for a texture
 */
export function createUrlIcon(
    ctx: CanvasRenderingContext2D,
    url: string,
    imageSize: Size,
    iconSize: Size
): Promise<ImageData | null> {
    return new Promise((resolve, reject) => {
        // create an Image from the url
        const image = new Image(imageSize.width, imageSize.height)
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            // render the image into the canvas
            ctx.clearRect(0, 0, iconSize.width, iconSize.height)
            ctx.drawImage(
                image,
                0,
                0,
                imageSize.width,
                imageSize.height,
                0,
                0,
                iconSize.width,
                iconSize.height
            )
            const imageData = ctx.getImageData(0, 0, iconSize.width, iconSize.height)
            resolve(imageData)
        }
        image.onerror = () => {
            resolve(null)
        }
        image.src = url
    })
}

/**
 * Create a custom canvas to render the icons
 */
export function createCanvasContext(iconSize: Size) {
    // canvas used to pre-render the icons
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', `${iconSize.width}`)
    canvas.setAttribute('height', `${iconSize.height}`)
    return canvas.getContext('2d')!
}