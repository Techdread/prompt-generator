import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_ENDPOINTS = {
  OpenAI: 'https://api.openai.com/v1/chat/completions',
  Anthropic: 'https://api.anthropic.com/v1/messages',
  // Gemini doesn't need an endpoint as it uses the SDK
}

export async function generatePrompt({ description, appType, provider, apiKey, modelName, baseUrl, verbosityLevel = 'standard', onStream }) {
  const systemPrompt = getSystemPrompt(appType, verbosityLevel)
  
  const formatInstructions = {
    concise: 'Provide ONLY the prompt text. Do not include any meta-commentary, explanations, or introductory text.',
    standard: 'Provide the prompt with minimal context. Keep any explanations brief and focused.',
    detailed: 'Provide a comprehensive prompt with detailed explanations and considerations.'
  }

  const userPrompt = `${description}\n\nFormatting Instructions: ${formatInstructions[verbosityLevel]}`
  
  try {
    switch (provider) {
      case 'OpenAI':
        return await generateOpenAIPrompt({
          description: userPrompt,
          systemPrompt,
          apiKey,
          modelName,
          baseUrl: API_ENDPOINTS.OpenAI,
          onStream,
        })
      case 'OpenAI Compatible':
        if (!baseUrl) {
          throw new Error('Base URL is required for OpenAI Compatible providers')
        }
        return await generateOpenAIPrompt({
          description: userPrompt,
          systemPrompt,
          apiKey,
          modelName,
          baseUrl: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
          onStream,
        })
      case 'Anthropic':
        return await generateAnthropicPrompt({
          description: userPrompt,
          systemPrompt,
          apiKey,
          modelName,
        })
      case 'Google Gemini':
        return await generateGeminiPrompt({
          description: userPrompt,
          systemPrompt,
          apiKey,
          modelName,
          onStream,
        })
      default:
        throw new Error('Unsupported LLM provider')
    }
  } catch (error) {
    console.error('Error generating prompt:', error)
    throw new Error(error.response?.data?.error?.message || error.message)
  }
}

async function generateOpenAIPrompt({ description, systemPrompt, apiKey, modelName, baseUrl, onStream }) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  const body = {
    model: modelName || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description },
    ],
    stream: Boolean(onStream),
  }

  if (onStream) {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate prompt')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              buffer += content
              onStream(buffer)
            }
          } catch (e) {
            console.error('Error parsing chunk:', e)
          }
        }
      }
    }
    return buffer
  } else {
    const response = await axios.post(baseUrl, body, { headers })
    return response.data.choices[0].message.content
  }
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

async function generateGeminiPrompt({ description, systemPrompt, apiKey, modelName, onStream }) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName || 'gemini-pro' })

  const prompt = `${systemPrompt}\n\n${description}`

  try {
    if (onStream) {
      const result = await model.generateContentStream(prompt)
      let buffer = ''
      
      for await (const chunk of result.stream) {
        const text = chunk.text()
        buffer += text
        onStream(buffer)
      }
      
      return buffer
    } else {
      const result = await model.generateContent(prompt)
      return result.response.text()
    }
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`)
  }
}

export async function testConnection({ provider, apiKey, modelName, baseUrl }) {
  try {
    switch (provider) {
      case 'OpenAI':
        // Test OpenAI connection with a minimal request
        const openAiResponse = await axios.post(
          API_ENDPOINTS.OpenAI,
          {
            model: modelName || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true };

      case 'OpenAI Compatible':
        if (!baseUrl) {
          throw new Error('Base URL is required for OpenAI Compatible providers');
        }
        // Test custom OpenAI-compatible endpoint
        const customResponse = await axios.post(
          `${baseUrl.replace(/\/$/, '')}/chat/completions`,
          {
            model: modelName || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true };

      case 'Anthropic':
        // Test Anthropic connection
        const anthropicResponse = await axios.post(
          API_ENDPOINTS.Anthropic,
          {
            model: modelName || 'claude-2',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          },
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true };

      case 'Google Gemini':
        // Test Gemini connection
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-pro' });
        await model.generateContent('test');
        return { success: true };

      default:
        throw new Error('Unsupported provider');
    }
  } catch (error) {
    // Return detailed error information
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Connection failed'
    };
  }
}

function getSystemPrompt(appType, verbosityLevel = 'standard') {
  const baseInstructions = {
    concise: 'Generate a direct, implementation-focused prompt without any explanations or meta-commentary. The prompt should be ready to be fed directly into an LLM.',
    standard: 'Generate a balanced prompt that includes key implementation details while maintaining clarity and focus.',
    detailed: 'Generate a comprehensive prompt that covers all aspects of the implementation with detailed explanations and considerations.'
  }

  const appTypeInstructions = {
    'HTML Games': 'Focus on HTML5 Canvas, game mechanics, user interactions, and browser compatibility.',
    'React Vite Games': 'Focus on React components, state management, game logic, and build optimization.',
    'HTML Three.js Visualizations': 'Focus on 3D rendering, scene setup, camera controls, and performance optimization.',
    'Python Utilities': 'Focus on modularity, error handling, CLI interface, and Python best practices.'
  }

  return `You are an expert software developer specializing in creating ${appType}. ${baseInstructions[verbosityLevel]} Consider these specific aspects: ${appTypeInstructions[appType]}`
}
