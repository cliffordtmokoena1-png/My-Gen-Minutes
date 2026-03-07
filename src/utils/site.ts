export function getSiteFromRequest(request: Request): Site {
    const headers = request.headers;
    return getSiteFromHeaders(headers);
}