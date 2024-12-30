import React, { useState, useEffect } from 'react'
import { promptsDb } from '../services/db'
import { formatDistanceToNow } from 'date-fns'

export default function PromptHistory({ onSelectPrompt }) {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    appType: '',
    provider: '',
    searchText: ''
  })

  useEffect(() => {
    loadPrompts()
  }, [filter])

  async function loadPrompts() {
    try {
      let results
      if (filter.searchText) {
        results = await promptsDb.searchPrompts(filter.searchText)
      } else {
        results = await promptsDb.getPrompts({
          appType: filter.appType || undefined,
          provider: filter.provider || undefined
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

  function truncateText(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full px-3 py-2 border rounded-md"
          value={filter.searchText}
          onChange={(e) => setFilter(prev => ({ ...prev, searchText: e.target.value }))}
        />
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
                className="p-4 hover:bg-gray-50 cursor-pointer"
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
                <div className="mt-2 text-xs text-gray-500">
                  Provider: {prompt.provider}
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
