import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_ENDPOINTS = {
  OpenAI: 'https://api.openai.com/v1/chat/completions',
  Anthropic: 'https://api.anthropic.com/v1/messages',
  // Gemini doesn't need an endpoint as it uses the SDK
}

export async function generatePrompt({ description, appType, provider, apiKey, modelName, baseUrl }) {
  const systemPrompt = getSystemPrompt(appType)
  
  try {
    switch (provider) {
      case 'OpenAI':
        return await generateOpenAIPrompt({
          description,
          systemPrompt,
          apiKey,
          modelName,
          baseUrl: API_ENDPOINTS.OpenAI,
        })
      case 'OpenAI Compatible':
        if (!baseUrl) {
          throw new Error('Base URL is required for OpenAI Compatible providers')
        }
        return await generateOpenAIPrompt({
          description,
          systemPrompt,
          apiKey,
          modelName,
          baseUrl: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        })
      case 'Anthropic':
        return await generateAnthropicPrompt({
          description,
          systemPrompt,
          apiKey,
          modelName,
        })
      case 'Google Gemini':
        return await generateGeminiPrompt({
          description,
          systemPrompt,
          apiKey,
          modelName,
        })
      default:
        throw new Error('Unsupported LLM provider')
    }
  } catch (error) {
    console.error('Error generating prompt:', error)
    throw new Error(error.response?.data?.error?.message || error.message)
  }
}

async function generateOpenAIPrompt({ description, systemPrompt, apiKey, modelName, baseUrl }) {
  const response = await axios.post(
    baseUrl,
    {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data.choices[0].message.content
}

async function generateAnthropicPrompt({ description, systemPrompt, apiKey, modelName }) {
  const response = await axios.post(
    API_ENDPOINTS.Anthropic,
    {
      model: modelName,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\nUser Request: ${description}` }
      ],
      max_tokens: 1000,
    },
    {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data.content[0].text
}

async function generateGeminiPrompt({ description, systemPrompt, apiKey, modelName }) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.0-pro' })

  const prompt = `${systemPrompt}\n\nUser Request: ${description}`
  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

function getSystemPrompt(appType) {
  const basePrompt = 'You are an expert software developer specializing in creating detailed and comprehensive prompts for application development. Your task is to enhance and expand the user\'s app description into a detailed prompt that covers all necessary aspects of the application.'

  const typeSpecificPrompts = {
    'HTML Games': `${basePrompt}\n\nFocus on HTML5 Canvas, JavaScript game mechanics, sprite management, collision detection, game loop implementation, and responsive design considerations. Include requirements for assets, animations, and sound effects.`,
    
    'React Vite Games': `${basePrompt}\n\nFocus on React component architecture, state management, game logic implementation using hooks, asset management with Vite, and performance optimization. Include considerations for build process and deployment.`,
    
    'HTML Three.js Visualizations': `${basePrompt}\n\nFocus on Three.js scene setup, camera positioning, lighting, material properties, geometry creation, animation system, and user interactions. Include requirements for 3D models, textures, and performance optimization.`,
    
    'Python Utilities': `${basePrompt}\n\nFocus on command-line interface design, input validation, error handling, file operations, and potential integration with external services or APIs. Include requirements for dependencies, configuration, and documentation.`,
  }

  return typeSpecificPrompts[appType] || basePrompt
}
