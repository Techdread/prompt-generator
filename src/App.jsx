import React, { useState } from 'react'
import PromptGenerator from './components/PromptGenerator'
import PromptHistory from './components/PromptHistory'

function App() {
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Side Panel */}
        <div
          className={`bg-white w-80 border-r transition-all duration-300 ${
            isPanelOpen ? 'translate-x-0' : '-translate-x-80'
          }`}
        >
          <div className="h-full">
            <PromptHistory
              onSelectPrompt={setSelectedPrompt}
            />
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="fixed left-80 top-4 z-10 p-2 bg-white border rounded-r-md shadow-md"
        >
          {isPanelOpen ? '←' : '→'}
        </button>

        {/* Main Content */}
        <div className="flex-1 overflow-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Interactive Prompt Generator
            </h1>
            <PromptGenerator
              initialPrompt={selectedPrompt}
              onPromptGenerated={(promptData) => {
                setSelectedPrompt(null) // Clear selection after generating
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
