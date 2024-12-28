import React, { useState, useEffect } from 'react'
import { ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { generatePrompt, testConnection } from '../utils/api'
import { promptsDb } from '../services/db'

const APP_TYPES = [
  'HTML Games',
  'React Vite Games',
  'HTML Three.js Visualizations',
  'Python Utilities'
]

const LLM_PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google Gemini',
  'OpenAI Compatible',
  // Add more providers as needed
]

const VERBOSITY_LEVELS = [
  { value: 'concise', label: 'Concise', description: 'Direct prompt without any explanations' },
  { value: 'standard', label: 'Standard', description: 'Balanced prompt with some context' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive prompt with full explanations' }
]

export default function PromptGenerator({ initialPrompt, onPromptGenerated }) {
  const [appDescription, setAppDescription] = useState('')
  const [appType, setAppType] = useState(APP_TYPES[0])
  const [provider, setProvider] = useState(LLM_PROVIDERS[0])
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [verbosityLevel, setVerbosityLevel] = useState('standard')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)

  // Load initial prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      setAppDescription(initialPrompt.appDescription || '')
      setAppType(initialPrompt.appType || APP_TYPES[0])
      setProvider(initialPrompt.provider || LLM_PROVIDERS[0])
      setApiKey(initialPrompt.apiKey || '')
      setModelName(initialPrompt.modelName || '')
      setBaseUrl(initialPrompt.baseUrl || '')
      setGeneratedPrompt(initialPrompt.generatedPrompt || '')
      setVerbosityLevel(initialPrompt.verbosityLevel || 'standard')
    }
  }, [initialPrompt])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setGeneratedPrompt('')

    try {
      if (provider === 'OpenAI' || provider === 'OpenAI Compatible' || provider === 'Google Gemini') {
        await generatePrompt({
          description: appDescription,
          appType,
          provider,
          apiKey,
          modelName,
          baseUrl,
          verbosityLevel,
          onStream: (text) => {
            setGeneratedPrompt(text)
          }
        })
      } else {
        const prompt = await generatePrompt({
          description: appDescription,
          appType,
          provider,
          apiKey,
          modelName,
          baseUrl,
          verbosityLevel
        })
        setGeneratedPrompt(prompt)
      }

      // Save the prompt to the database
      const promptData = {
        appDescription,
        appType,
        provider,
        apiKey,
        modelName,
        baseUrl,
        verbosityLevel,
        generatedPrompt
      }
      await promptsDb.savePrompt(promptData)
      
      if (onPromptGenerated) {
        onPromptGenerated(promptData)
      }
    } catch (err) {
      setError(err.message || 'Failed to generate prompt')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus(null)
    setError('')

    try {
      const result = await testConnection({
        provider,
        apiKey,
        modelName,
        baseUrl
      })

      setConnectionStatus(result)
    } catch (err) {
      setConnectionStatus({
        success: false,
        error: err.message || 'Connection test failed'
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="appDescription" className="block text-sm font-medium text-gray-700">
            App Description
          </label>
          <textarea
            id="appDescription"
            value={appDescription}
            onChange={(e) => setAppDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows="4"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="appType" className="block text-sm font-medium text-gray-700">
              App Type
            </label>
            <select
              id="appType"
              value={appType}
              onChange={(e) => setAppType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {APP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
              LLM Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setConnectionStatus(null)
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {LLM_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              API Key
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setConnectionStatus(null)
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your API key"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!apiKey || isTestingConnection}
                className={`ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${
                  !apiKey || isTestingConnection
                    ? 'bg-gray-300 cursor-not-allowed'
                    : connectionStatus?.success
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isTestingConnection ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : connectionStatus?.success ? (
                  'Connected'
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>
            {connectionStatus?.error && (
              <p className="mt-1 text-sm text-red-600">{connectionStatus.error}</p>
            )}
          </div>

          <div>
            <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">
              Model Name
            </label>
            <input
              id="modelName"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {provider === 'OpenAI Compatible' && (
          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">
              Base URL
            </label>
            <input
              id="baseUrl"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the base URL of your OpenAI-compatible API (e.g., LMStudio, LocalAI)
            </p>
          </div>
        )}

        {/* Verbosity Level */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Verbosity Level
          </label>
          <div className="mt-1 grid grid-cols-3 gap-3">
            {VERBOSITY_LEVELS.map(({ value, label, description }) => (
              <div
                key={value}
                className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                  verbosityLevel === value
                    ? 'border-indigo-500 ring-2 ring-indigo-500'
                    : 'border-gray-300'
                }`}
                onClick={() => setVerbosityLevel(value)}
              >
                <div className="flex flex-1">
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">
                      {label}
                    </span>
                    <span className="mt-1 flex items-center text-sm text-gray-500">
                      {description}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? 'Generating...' : 'Generate Prompt'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">Generated Prompt</h3>
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-4">
            <pre className="whitespace-pre-wrap">{generatedPrompt}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
