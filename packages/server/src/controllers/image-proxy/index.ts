import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

const ALLOWED_HOST_SUFFIXES = ['byteimg.com', 'volcengineapi.com']

const isAllowedImageUrl = (urlStr: string): boolean => {
    try {
        const u = new URL(urlStr)
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
        const host = u.hostname.toLowerCase()
        return ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))
    } catch {
        return false
    }
}

/**
 * Proxy remote images (e.g. Jimeng/Volcengine signed URLs) so browser can render them reliably.
 * This endpoint is intentionally unauthenticated but strictly allowlisted by hostname.
 */
const proxyImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const url = (req.query.url as string) || ''
        if (!url) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Missing url')
        if (url.length > 4096) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'url too long')
        if (!isAllowedImageUrl(url)) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'url not allowed')

        const upstream = await fetch(url, {
            method: 'GET',
            headers: {
                // Some CDNs require a browser-ish UA or referer.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
                Referer: 'https://www.volcengine.com/'
            }
        })

        if (!upstream.ok) {
            throw new InternalFlowiseError(StatusCodes.BAD_GATEWAY, `Upstream error: ${upstream.status}`)
        }

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
        const arrayBuffer = await upstream.arrayBuffer()

        res.setHeader('Content-Type', contentType)
        res.setHeader('Cache-Control', 'public, max-age=3600')
        return res.status(StatusCodes.OK).send(Buffer.from(arrayBuffer))
    } catch (error) {
        if (error instanceof InternalFlowiseError) return next(error)
        return next(new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: imageProxy.proxyImage - ${getErrorMessage(error)}`))
    }
}

export default {
    proxyImage
}
