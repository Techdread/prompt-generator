import React, { useState, useEffect } from 'react'
import { promptsDb } from '../services/db'
import { formatDistanceToNow } from 'date-fns'
import { FolderIcon, FolderPlusIcon, DocumentIcon } from '@heroicons/react/24/outline'

export default function PromptHistory({ onSelectPrompt }) {
  const [prompts, setPrompts] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [filter, setFilter] = useState({
    appType: '',
    provider: '',
    searchText: ''
  })

  useEffect(() => {
    loadPrompts()
    loadFolders()
  }, [filter, selectedFolder])

  async function loadFolders() {
    try {
      const results = await promptsDb.getFolders()
      setFolders(results)
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  async function loadPrompts() {
    try {
      let results
      if (filter.searchText) {
        results = await promptsDb.searchPrompts(filter.searchText)
      } else {
        results = await promptsDb.getPrompts({
          appType: filter.appType || undefined,
          provider: filter.provider || undefined,
          folderId: selectedFolder?._id
        })
      }
      setPrompts(results)
    } catch (error) {
      console.error('Error loading prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await promptsDb.deletePrompt(id)
        loadPrompts()
      } catch (error) {
        console.error('Error deleting prompt:', error)
      }
    }
  }

  async function handleCreateFolder(e) {
    e.preventDefault()
    if (!newFolderName.trim()) return

    try {
      await promptsDb.createFolder(newFolderName.trim())
      setNewFolderName('')
      setShowNewFolderInput(false)
      loadFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  async function handleMoveToFolder(promptId, folderId, e) {
    e.stopPropagation()
    try {
      await promptsDb.movePromptToFolder(promptId, folderId)
      loadPrompts()
    } catch (error) {
      console.error('Error moving prompt:', error)
    }
  }

  function truncateText(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-4">
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full px-3 py-2 border rounded-md"
          value={filter.searchText}
          onChange={(e) => setFilter(prev => ({ ...prev, searchText: e.target.value }))}
        />
        
        {/* Folders Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Folders</h3>
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              <FolderPlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          {showNewFolderInput && (
            <form onSubmit={handleCreateFolder} className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="flex-1 px-2 py-1 border rounded-md text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-1 bg-blue-600 text-white rounded-md text-sm"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-2 py-1 rounded-md flex items-center gap-2 ${
                !selectedFolder ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <DocumentIcon className="h-4 w-4" />
              All Prompts
            </button>
            {folders.map(folder => (
              <button
                key={folder._id}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full text-left px-2 py-1 rounded-md flex items-center gap-2 ${
                  selectedFolder?._id === folder._id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <FolderIcon className="h-4 w-4" />
                {folder.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : prompts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No prompts found</div>
        ) : (
          <div className="divide-y">
            {prompts.map(prompt => (
              <div
                key={prompt._id}
                className="p-4 hover:bg-gray-50 cursor-pointer relative group"
                onClick={() => onSelectPrompt(prompt)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{prompt.appType}</div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(prompt.timestamp)} ago
                    </div>
                    <div className="mt-2 text-sm">
                      {truncateText(prompt.appDescription)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Move to folder dropdown */}
                    <div className="relative">
                      <select
                        onChange={(e) => handleMoveToFolder(prompt._id, e.target.value, e)}
                        value={prompt.folderId || ''}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 text-sm border rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Move to folder</option>
                        {folders.map(folder => (
                          <option key={folder._id} value={folder._id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(prompt._id)
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Provider: {prompt.provider}
                  {prompt.folderId && (
                    <span className="ml-2">
                      Folder: {folders.find(f => f._id === prompt.folderId)?.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={async () => {
            const prompts = await promptsDb.exportPrompts()
            const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'prompts-export.json'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Export Prompts
        </button>
      </div>
    </div>
  )
}
