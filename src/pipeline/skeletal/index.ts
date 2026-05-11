import type { SkeletalMarkers, Point, MarkerName } from '../../types'

const MARKER_COLORS: Record<MarkerName, string> = {
  pelvis: '#ff0000',
  head: '#ffff00',
  leftHand: '#0000ff',
  rightHand: '#0000ff',
  leftFoot: '#00ff00',
  rightFoot: '#00ff00',
}

export function createDefaultMarkers(width: number, height: number): SkeletalMarkers {
  const centerX = width / 2
  const topThird = height / 3
  const bottomThird = (height * 2) / 3

  return {
    pelvis: { x: centerX, y: bottomThird },
    head: { x: centerX, y: topThird },
    leftHand: { x: centerX - width / 4, y: bottomThird },
    rightHand: { x: centerX + width / 4, y: bottomThird },
    leftFoot: { x: centerX - width / 6, y: height - 5 },
    rightFoot: { x: centerX + width / 6, y: height - 5 },
  }
}

export function isNearPoint(
  click: Point,
  marker: Point,
  threshold: number = 10
): boolean {
  const dx = click.x - marker.x
  const dy = click.y - marker.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance <= threshold
}

export function validateMarkers(markers: SkeletalMarkers): string[] {
  const warnings: string[] = []

  if (markers.pelvis.y < markers.head.y) {
    warnings.push('Pelvis Y position is above head Y position (anatomically unusual)')
  }

  return warnings
}

export function getMarkerColor(name: MarkerName): string {
  return MARKER_COLORS[name]
}
