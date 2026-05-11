import type { SkeletalMarkers, MarkerName } from '../../types'
export type { MarkerName }

export interface AlignmentPreviewState {
  selectedMarker: MarkerName | null
  isEditing: boolean
  showLabels: boolean
  showConnections: boolean
}

export const DEFAULT_ALIGNMENT_PREVIEW_STATE: AlignmentPreviewState = {
  selectedMarker: null,
  isEditing: false,
  showLabels: true,
  showConnections: true,
}

export const MARKER_CONFIGS: Record<
  MarkerName,
  { label: string; color: string; defaultPosition: (w: number, h: number) => { x: number; y: number} }
> = {
  pelvis: {
    label: 'Pelvis',
    color: '#FF6B6B',
    defaultPosition: (w, h) => ({ x: w / 2, y: h * 0.6 }),
  },
  head: {
    label: 'Head',
    color: '#4ECDC4',
    defaultPosition: (w, h) => ({ x: w / 2, y: h * 0.25 }),
  },
  leftHand: {
    label: 'L Hand',
    color: '#FFE66D',
    defaultPosition: (w, h) => ({ x: w * 0.25, y: h * 0.5 }),
  },
  rightHand: {
    label: 'R Hand',
    color: '#95E1D3',
    defaultPosition: (w, h) => ({ x: w * 0.75, y: h * 0.5 }),
  },
  leftFoot: {
    label: 'L Foot',
    color: '#F38181',
    defaultPosition: (w, h) => ({ x: w * 0.35, y: h * 0.9 }),
  },
  rightFoot: {
    label: 'R Foot',
    color: '#AA96DA',
    defaultPosition: (w, h) => ({ x: w * 0.65, y: h * 0.9 }),
  },
}

export function renderAlignmentPreview(
  markers: SkeletalMarkers,
  ctx: CanvasRenderingContext2D,
  state: AlignmentPreviewState,
  scale: number = 1
): void {
  const positions = markers

  if (state.showConnections) {
    renderSkeletonConnections(positions, ctx, scale)
  }

  for (const [markerName, point] of Object.entries(positions) as [MarkerName, { x: number; y: number }][]) {
    const config = MARKER_CONFIGS[markerName]
    const isSelected = state.selectedMarker === markerName

    renderMarker(
      point.x * scale,
      point.y * scale,
      config.color,
      config.label,
      isSelected,
      state.showLabels,
      ctx
    )
  }
}

function renderSkeletonConnections(
  markers: SkeletalMarkers,
  ctx: CanvasRenderingContext2D,
  scale: number
): void {
  const connections: [keyof SkeletalMarkers, keyof SkeletalMarkers][] = [
    ['pelvis', 'head'],
    ['pelvis', 'leftHand'],
    ['pelvis', 'rightHand'],
    ['pelvis', 'leftFoot'],
    ['pelvis', 'rightFoot'],
  ]

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2 * scale

  for (const [from, to] of connections) {
    const fromPoint = markers[from]
    const toPoint = markers[to]

    ctx.beginPath()
    ctx.moveTo(fromPoint.x * scale, fromPoint.y * scale)
    ctx.lineTo(toPoint.x * scale, toPoint.y * scale)
    ctx.stroke()
  }

  ctx.restore()
}

function renderMarker(
  x: number,
  y: number,
  color: string,
  label: string,
  isSelected: boolean,
  showLabel: boolean,
  ctx: CanvasRenderingContext2D
): void {
  const size = isSelected ? 12 : 8

  ctx.save()

  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = isSelected ? 3 : 2
  ctx.stroke()

  if (isSelected) {
    ctx.beginPath()
    ctx.arc(x, y, size + 4, 0, Math.PI * 2)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }

  if (showLabel) {
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    const textY = y - size - 4
    ctx.strokeText(label, x, textY)
    ctx.fillText(label, x, textY)
  }

  ctx.restore()
}

export function hitTestMarker(
  x: number,
  y: number,
  markers: SkeletalMarkers,
  scale: number = 1,
  hitRadius: number = 15
): MarkerName | null {
  for (const [markerName, point] of Object.entries(markers) as [MarkerName, { x: number; y: number }][]) {
    const dx = point.x * scale - x
    const dy = point.y * scale - y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= hitRadius) {
      return markerName
    }
  }

  return null
}

export function initializeDefaultMarkers(
  frameWidth: number,
  frameHeight: number
): SkeletalMarkers {
  return {
    pelvis: MARKER_CONFIGS.pelvis.defaultPosition(frameWidth, frameHeight),
    head: MARKER_CONFIGS.head.defaultPosition(frameWidth, frameHeight),
    leftHand: MARKER_CONFIGS.leftHand.defaultPosition(frameWidth, frameHeight),
    rightHand: MARKER_CONFIGS.rightHand.defaultPosition(frameWidth, frameHeight),
    leftFoot: MARKER_CONFIGS.leftFoot.defaultPosition(frameWidth, frameHeight),
    rightFoot: MARKER_CONFIGS.rightFoot.defaultPosition(frameWidth, frameHeight),
  }
}
