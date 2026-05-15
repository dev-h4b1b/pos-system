import type { Role, StoredUser } from '../context/auth-context'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Check, Pencil, Settings, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/auth-context'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={role === 'admin'
        ? { backgroundColor: '#eef2ff', color: '#4338ca' }
        : { backgroundColor: '#f1f5f9', color: '#475569' }}
    >
      {role}
    </span>
  )
}

interface AddUserModalProps {
  onClose: () => void
}

function AddUserModal({ onClose }: AddUserModalProps) {
  const { addUser } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = addUser(username, password, role)
    if (err) { setError(err); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Add User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
            <input
              autoFocus
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. john"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditRowProps {
  u: StoredUser
  isSelf: boolean
  onDone: () => void
}

function EditRow({ u, isSelf, onDone }: EditRowProps) {
  const { updateUser } = useAuth()
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(u.role)

  function handleSave() {
    const data: { password?: string, role?: Role } = {}
    if (password)
      data.password = password
    if (role !== u.role)
      data.role = role
    if (Object.keys(data).length)
      updateUser(u.username, data)
    onDone()
  }

  return (
    <tr className="bg-indigo-50">
      <td className="px-4 py-2 text-sm text-slate-700 font-medium">{u.username}</td>
      <td className="px-4 py-2">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="New password (leave blank to keep)"
          className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-2">
        <select
          value={role}
          onChange={e => setRole(e.target.value as Role)}
          disabled={isSelf}
          className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onDone}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function SettingsPage() {
  const { user, users, deleteUser } = useAuth()

  if (user?.role !== 'admin')
    return <Navigate to="/" />

  const [showAdd, setShowAdd] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleDelete(username: string) {
    if (confirmDelete === username) {
      deleteUser(username)
      setConfirmDelete(null)
    }
    else {
      setConfirmDelete(username)
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
              <p className="text-xs text-slate-500">Manage user accounts</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Username</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.username === user?.username
                if (editingUser === u.username) {
                  return (
                    <EditRow
                      key={u.username}
                      u={u}
                      isSelf={isSelf}
                      onDone={() => setEditingUser(null)}
                    />
                  )
                }
                return (
                  <tr key={u.username} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {u.username}
                      {isSelf && (
                        <span className="ml-2 text-xs text-slate-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 tracking-widest">••••••••</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingUser(u.username); setConfirmDelete(null) }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(u.username)}
                            className={`flex h-7 items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors ${
                              confirmDelete === u.username
                                ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-red-500'
                            }`}
                            title="Delete"
                          >
                            {confirmDelete === u.username
                              ? 'Confirm?'
                              : <Trash2 size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
