# Prompt Generator

A modern, interactive prompt generator built with React and Vite that supports multiple LLM providers including OpenAI, Anthropic, Google Gemini, and custom OpenAI-compatible endpoints.

## Features

- 🤖 Support for multiple LLM providers
  - OpenAI
  - Anthropic
  - Google Gemini
  - Custom OpenAI-compatible endpoints
- 📝 Markdown preview support with toggle for raw text
- 💾 Local storage of prompts using IndexedDB
- 🔍 Search and filter saved prompts
- 📤 Export prompts as JSON
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🔄 Real-time prompt generation
- 🎯 Adjustable verbosity levels (Concise, Standard, Detailed)
- 🎮 Specialized prompts for different app types:
  - HTML Games
  - React Vite Games
  - HTML Three.js Visualizations
  - Python Utilities

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Techdread/prompt-generator.git
cd prompt-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. Select your desired LLM provider from the dropdown menu
2. Enter your API key in the secure input field
3. Choose the type of application you want to generate a prompt for
4. Select your preferred verbosity level:
   - Concise: Direct prompt without explanations
   - Standard: Balanced prompt with some context
   - Detailed: Comprehensive prompt with full explanations
5. Enter a description of what you want the prompt to do
6. Click "Generate Prompt" to create your prompt
7. Toggle between markdown and raw text views using the switch
8. Copy the generated prompt using the copy button
9. Generated prompts are automatically saved and can be accessed from the history panel

## Environment Variables

Create a `.env` file in the root directory with your API keys (optional):

```env
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GEMINI_API_KEY=your_gemini_key
```

## Project Structure

```
prompt-generator/
├── src/
│   ├── components/         # React components
│   ├── services/          # Database and API services
│   ├── utils/             # Utility functions
│   └── App.jsx           # Main application component
├── public/               # Static assets
├── index.html           # Entry HTML file
└── vite.config.js       # Vite configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
