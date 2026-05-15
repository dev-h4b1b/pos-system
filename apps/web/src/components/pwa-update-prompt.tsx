import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh)
    return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
      <span className="text-sm">A new version is available.</span>
      <button
        className="rounded-lg bg-indigo-500 px-3 py-1 text-sm font-medium hover:bg-indigo-400"
        onClick={() => updateServiceWorker(true)}
      >
        Update
      </button>
    </div>
  )
}
