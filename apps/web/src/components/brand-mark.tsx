import { useId } from 'react'

export function BrandMark({ className = '' }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg
      aria-hidden="true"
      className={`brand-mark ${className}`.trim()}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="3" y1="4" x2="45" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6F986D" />
          <stop offset="1" stopColor="#E9793F" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill="#191C18" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
      <text x="24" y="25" fill="#FFFEFA" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="800" letterSpacing="-1.2" textAnchor="middle">GQ</text>
      <rect x="14" y="35" width="4" height="5" rx="1" fill="#6F986D" />
      <rect x="21" y="32" width="4" height="8" rx="1" fill="#A5A66A" />
      <rect x="28" y="28" width="4" height="12" rx="1" fill="#E99A58" />
      <rect x="35" y="33" width="4" height="7" rx="1" fill="#E9793F" />
    </svg>
  )
}
