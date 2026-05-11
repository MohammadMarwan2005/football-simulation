// Collects browser/session info and POSTs it once to /api/session.php.
// Best-effort — failures are silent so they never disrupt the simulation.

function getGpuInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: null, renderer: null };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return { vendor: null, renderer: gl.getParameter(gl.RENDERER) };
    return {
      vendor:   gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
    };
  } catch {
    return { vendor: null, renderer: null };
  }
}

async function canvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 60;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 240, 60);
    ctx.fillStyle = '#069';
    ctx.fillText('football-sim:fp', 2, 2);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('football-sim:fp', 4, 17);
    const data = canvas.toDataURL();
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  } catch {
    return null;
  }
}

export async function trackSession() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const gpu  = getGpuInfo();
  const fp   = await canvasFingerprint();

  const payload = {
    language:        navigator.language || null,
    languages:       Array.from(navigator.languages || []),
    timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    screen_w:        screen.width,
    screen_h:        screen.height,
    viewport_w:      window.innerWidth,
    viewport_h:      window.innerHeight,
    pixel_ratio:     window.devicePixelRatio || 1,
    cpu_cores:       navigator.hardwareConcurrency || null,
    device_memory:   navigator.deviceMemory || null,
    gpu_vendor:      gpu.vendor,
    gpu_renderer:    gpu.renderer,
    touch_support:   'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cookies_enabled: navigator.cookieEnabled,
    do_not_track:    navigator.doNotTrack || null,
    connection_type: conn?.effectiveType || null,
    downlink:        conn?.downlink ?? null,
    rtt:             conn?.rtt ?? null,
    fingerprint:     fp,
    page_url:        location.href,
  };

  try {
    await fetch('/api/session.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // best-effort; ignore network/CORS errors
  }
}
