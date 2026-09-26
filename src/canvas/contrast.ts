// WCAG relative luminance of a #RRGGBB color.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const INK = luminance('#1F1A33')

/** True when white text has more contrast on this color than `--ink`. Anything but #RRGGBB keeps `--ink`. */
export function whiteTextOn(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false
  const l = luminance(hex) + 0.05
  return 1.05 / l > l / (INK + 0.05)
}
