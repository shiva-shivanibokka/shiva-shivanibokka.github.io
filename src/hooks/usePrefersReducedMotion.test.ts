import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

test('returns true when the OS prefers reduced motion', () => {
  window.matchMedia = ((q: string) => ({
    matches: true, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as any
  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(result.current).toBe(true)
})
