import { describe, it, expect } from 'vitest'
import { createDefaultMarkers, isNearPoint, validateMarkers, getMarkerColor } from '../index'
import type { SkeletalMarkers, Point } from '../../../types'

describe('Skeletal marker system', () => {
  describe('createDefaultMarkers', () => {
    it('should create markers with pelvis at center-bottom-third', () => {
      const markers = createDefaultMarkers(64, 64)

      expect(markers.pelvis.x).toBe(32)
      expect(markers.pelvis.y).toBeCloseTo(42.67, 1)
    })

    it('should create markers with head at center-top-third', () => {
      const markers = createDefaultMarkers(64, 64)

      expect(markers.head.x).toBe(32)
      expect(markers.head.y).toBeCloseTo(21.33, 1)
    })

    it('should create markers with hands at sides near pelvis level', () => {
      const markers = createDefaultMarkers(100, 100)

      expect(markers.leftHand.x).toBe(25)
      expect(markers.leftHand.y).toBeCloseTo(66.67, 1)
      expect(markers.rightHand.x).toBe(75)
      expect(markers.rightHand.y).toBeCloseTo(66.67, 1)
    })

    it('should create markers with feet at bottom of frame', () => {
      const markers = createDefaultMarkers(64, 64)

      expect(markers.leftFoot.y).toBe(59)
      expect(markers.rightFoot.y).toBe(59)
    })
  })

  describe('isNearPoint', () => {
    it('should return true when click is within threshold distance', () => {
      const click: Point = { x: 50, y: 50 }
      const marker: Point = { x: 55, y: 55 }

      expect(isNearPoint(click, marker, 10)).toBe(true)
    })

    it('should return true when click is exactly at threshold distance', () => {
      const click: Point = { x: 50, y: 50 }
      const marker: Point = { x: 60, y: 50 }

      expect(isNearPoint(click, marker, 10)).toBe(true)
    })

    it('should return false when click is outside threshold distance', () => {
      const click: Point = { x: 50, y: 50 }
      const marker: Point = { x: 65, y: 50 }

      expect(isNearPoint(click, marker, 10)).toBe(false)
    })

    it('should use default threshold of 10 when not specified', () => {
      const click: Point = { x: 50, y: 50 }
      const marker: Point = { x: 59, y: 50 }

      expect(isNearPoint(click, marker)).toBe(true)
    })
  })

  describe('validateMarkers', () => {
    it('should warn when pelvis is above head', () => {
      const markers: SkeletalMarkers = {
        pelvis: { x: 32, y: 10 },
        head: { x: 32, y: 30 },
        leftHand: { x: 10, y: 40 },
        rightHand: { x: 54, y: 40 },
        leftFoot: { x: 20, y: 60 },
        rightFoot: { x: 44, y: 60 },
      }

      const warnings = validateMarkers(markers)

      expect(warnings).toContain('Pelvis Y position is above head Y position (anatomically unusual)')
    })

    it('should not warn when pelvis is below head', () => {
      const markers: SkeletalMarkers = {
        pelvis: { x: 32, y: 40 },
        head: { x: 32, y: 10 },
        leftHand: { x: 10, y: 40 },
        rightHand: { x: 54, y: 40 },
        leftFoot: { x: 20, y: 60 },
        rightFoot: { x: 44, y: 60 },
      }

      const warnings = validateMarkers(markers)

      expect(warnings).toHaveLength(0)
    })
  })

  describe('getMarkerColor', () => {
    it('should return red for pelvis', () => {
      expect(getMarkerColor('pelvis')).toBe('#ff0000')
    })

    it('should return yellow for head', () => {
      expect(getMarkerColor('head')).toBe('#ffff00')
    })

    it('should return blue for hands', () => {
      expect(getMarkerColor('leftHand')).toBe('#0000ff')
      expect(getMarkerColor('rightHand')).toBe('#0000ff')
    })

    it('should return green for feet', () => {
      expect(getMarkerColor('leftFoot')).toBe('#00ff00')
      expect(getMarkerColor('rightFoot')).toBe('#00ff00')
    })
  })
})
