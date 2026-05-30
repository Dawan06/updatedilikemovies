import { NextRequest } from 'next/server';
import { vidsrcClient } from '@/lib/vidsrc/vidsrc-client';

function sanitizeHtml(html: string, baseOrigin: string) {
    // Known ad / popup patterns to remove (script tags or inline occurrences)
    const adScriptPatterns: RegExp[] = [
        /window\.open\s*\([^)]*\)/gi,
        /location\.href\s*=\s*['"][^'"]*['"]/gi,
        /<script[^>]*src=['"][^'"]*(?:adservice|googlesyndication|doubleclick|adnxs|adsystem|popads|popcash|exoclick|trafficjunky|juicyads|hilltopads)[^'"]*['"][^>]*><\/script>/gi,
        /<script[^>]*src=['"][^'"]*(?:ad\.|ads\.|banner|popup|pop\.)[^'"]*['"][^>]*><\/script>/gi,
        /<script[^>]*>[\s\S]*?(?:window\.open|pop(?:under|up)|onclick.*?open|document\.location)[\s\S]*?<\/script>/gi,
    ];

    adScriptPatterns.forEach((p) => {
        html = html.replace(p, '');
    });

    // Remove <noscript> and <style> blocks
    html = html.replace(/<noscript[\s\S]*?>[\s\S]*?<\/noscript>/gi, '');
    html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');

    // Remove meta refresh
    html = html.replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');

    // Remove elements with ad/cookie/banner/overlay/promo/sponsor in class or id
    html = html.replace(/<([a-z0-9]+)[^>]*(?:class|id)=['"][^'"]*(?:ad|ads|banner|cookie|overlay|promo|sponsor)[^'"]*['"][^>]*>[\s\S]*?<\/\1>/gi, '');

    // Remove ad iframes
    html = html.replace(/<iframe[^>]*(?:src=["'][^"']*(?:ad|ads|doubleclick|googlesyndication|adservice|adnetwork)[^"']*["'][^>]*)[^>]*>[\s\S]*?<\/iframe>/gi, '');

    // Remove inline event handlers (onload, onclick, etc.)
    html = html.replace(/\son\w+=(['"]).*?\1/gi, '');

    // Rewrite root-relative URLs to absolute using base origin
    html = html.replace(/(src|href)=("|')\/(?!\/)([^"'>\s]+)("|')/gi, (m, p1, q1, path) => {
        return `${p1}=${q1}${baseOrigin}/${path}${q1}`;
    });

    return html;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const season = searchParams.get('s');
    const episode = searchParams.get('e');
    const provider = searchParams.get('provider'); // optional provider name

    if (!type || !id) {
        return new Response('Missing parameters', { status: 400 });
    }

    // Resolve candidate sources from vidsrc client
    let sources = [];
    try {
        if (type === 'movie') {
            sources = await vidsrcClient.getMovieSources(Number(id));
        } else {
            const s = season ? Number(season) : 1;
            const e = episode ? Number(episode) : 1;
            sources = await vidsrcClient.getTVSources(Number(id), s, e);
        }
    } catch (err) {
        console.error('Error fetching sources from vidsrcClient:', err);
        return new Response('Failed to resolve provider sources', { status: 502 });
    }

    if (!Array.isArray(sources) || sources.length === 0) {
        return new Response('No sources available', { status: 404 });
    }

    // Choose provider: by name if given, otherwise first source
    let chosen = sources[0];
    if (provider) {
        const found = sources.find((s) => s.provider && s.provider.toLowerCase() === provider.toLowerCase());
        if (found) chosen = found;
    }

    const targetUrl = chosen.url;
    if (!targetUrl) {
        return new Response('Invalid provider URL', { status: 500 });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const resp = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                Referer: new URL(targetUrl).origin,
            },
        });
        clearTimeout(timeout);

        if (!resp.ok) {
            return new Response('Failed to fetch provider content', { status: resp.status });
        }

        let html = await resp.text();
        const baseOrigin = new URL(targetUrl).origin;

        // Apply sanitization rules (remove known ad scripts / inline popups)
        html = sanitizeHtml(html, baseOrigin);

        // Ensure there's a base tag so relative resources still resolve
        if (!/\<base[^>]*\>/i.test(html)) {
            const baseTag = `<base href="${baseOrigin}/">`;
            html = html.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}`);
        }

        // Anti-popup / anti-redirect script injection
        const antiAdScript = `
            <script>
                // Disable window.open/popups
                try { window.open = function() { return null; }; } catch(e){}

                // Prevent direct location replace
                try {
                    Object.defineProperty(window, 'location', {
                        get: function() { return window._location || location; },
                        set: function(v) { console.log('Blocked redirect to', v); }
                    });
                } catch(e){}

                document.addEventListener('click', function(e) {
                    var t = e.target;
                    while(t && t !== document.body) {
                        if (t.tagName === 'A') {
                            var href = t.getAttribute('href') || '';
                            if (href && (href.indexOf('ads') !== -1 || href.indexOf('click') !== -1 || (href.startsWith('http') && href.indexOf('${baseOrigin}') === -1))) {
                                e.preventDefault(); e.stopPropagation(); return false;
                            }
                        }
                        t = t.parentElement;
                    }
                }, true);

                // Hide common ad overlays via CSS
                try {
                    var style = document.createElement('style');
                    style.textContent = "\n                        [class*=\"ad\"], [id*=\"ad-\"], [class*=\"banner\"], [id*=\"banner\"],\n                        [class*=\"popup\"], .overlay, #overlay, .modal:not(.player-modal),\n                        iframe[src*=\"ads\"], iframe[src*=\"click\"] { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }\n                    ";
                    document.head.appendChild(style);
                } catch(e){}
            <\/script>
        `;

        if (/<\/head>/i.test(html)) {
            html = html.replace(/<\/head>/i, `${antiAdScript}</head>`);
        } else {
            html = antiAdScript + html;
        }

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Frame-Options': 'SAMEORIGIN',
                'Content-Security-Policy': "frame-ancestors 'self'",
                'Cache-Control': 'private, max-age=60',
            },
        });
    } catch (err) {
        console.error('Proxy fetch/sanitize error:', err);
        if (err instanceof Error && err.name === 'AbortError') {
            return new Response('Timeout fetching provider', { status: 504 });
        }
        return new Response('Failed to proxy provider', { status: 500 });
    }
}