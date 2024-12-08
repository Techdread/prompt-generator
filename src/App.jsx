import React from 'react'
import PromptGenerator from './components/PromptGenerator'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Interactive Prompt Generator
        </h1>
        <PromptGenerator />
      </div>
    </div>
  )
}

export default App
