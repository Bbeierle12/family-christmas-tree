# AI Model Configuration

## Overview

The Vibe Coder now supports multiple AI model providers, giving you flexibility to choose between cloud-based and local models for powering the agentic coding workflows.

## Supported Providers

### 1. OpenAI (ChatGPT)
**Models Available:**
- GPT-4o (Recommended) - Most capable model, best for complex coding tasks
- GPT-4o Mini - Faster and more cost-effective
- GPT-4 Turbo - Previous generation flagship
- GPT-3.5 Turbo - Fastest and cheapest option

**Setup:**
1. Get your API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Go to Settings → API Keys
3. Select "OpenAI (ChatGPT)" as provider
4. Choose your preferred model
5. Enter your API key (starts with `sk-`)
6. Click "Save"

### 2. Anthropic (Claude)
**Models Available:**
- Claude 3.5 Sonnet (Recommended) - Most capable reasoning model
- Claude 3.5 Haiku - Fast and efficient
- Claude 3 Opus - Previous generation flagship

**Setup:**
1. Get your API key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Go to Settings → API Keys
3. Select "Anthropic (Claude)" as provider
4. Choose your preferred model
5. Enter your API key (starts with `sk-ant-`)
6. Click "Save"

### 3. Local Models (Ollama / LM Studio)
**Supported Inference Servers:**
- Ollama
- LM Studio
- Any OpenAI-compatible local server

**Popular Models:**
- llama3.2 - Meta's latest Llama model
- codestral - Mistral's code-specialized model
- deepseek-coder - Specialized for coding tasks
- qwen2.5-coder - Alibaba's coding model

**Setup:**
1. Install and run a local inference server:
   - **Ollama**: Download from [ollama.com](https://ollama.com)
   - **LM Studio**: Download from [lmstudio.ai](https://lmstudio.ai)
2. Pull your desired model:
   ```bash
   ollama pull llama3.2
   ```
3. Go to Settings → API Keys
4. Select "Local Model (Ollama/LM Studio)" as provider
5. Enter the model name (e.g., `llama3.2`)
6. Enter the API endpoint URL:
   - Default Ollama: `http://localhost:11434/api/chat`
   - LM Studio: Usually `http://localhost:1234/v1/chat/completions`
7. Click "Save Configuration"

## How It Works

### Architecture
The agent executor (`src/features/agent/executor.ts`) now supports multi-provider function calling:

1. **OpenAI**: Uses standard OpenAI Chat Completions API with function calling
2. **Anthropic**: Uses Claude Messages API with tool use
3. **Local**: Uses OpenAI-compatible API format (most local servers support this)

### Configuration Storage
All settings are stored in browser localStorage:
- `ai_provider` - Selected provider (openai/anthropic/local)
- `ai_model` - Selected model name
- `openai_api_key` - OpenAI API key
- `anthropic_api_key` - Anthropic API key
- `local_model_url` - Local model endpoint URL
- `local_model_name` - Local model name

### Workflow Integration
When you start a workflow in Vibe Coder:
1. `agentStore.startWorkflow()` loads configuration from localStorage
2. Creates `AgentExecutor` with provider-specific options
3. Executor routes API calls to appropriate provider
4. Tool calls work consistently across all providers

## Mock Mode

If no API key is configured, the system runs in **mock mode**:
- Simulates agent responses
- Executes tool calls with mock data
- Useful for development and testing
- No API calls are made

## Best Practices

### Cost Optimization
- Use **GPT-4o Mini** or **Claude 3.5 Haiku** for most tasks
- Reserve **GPT-4o** or **Claude 3.5 Sonnet** for complex refactoring

### Local Development
- Run **Ollama** locally for unlimited free usage
- **llama3.2** works well for UI-safe changes
- **codestral** or **deepseek-coder** excel at code generation

### Privacy
- Use local models when working with sensitive code
- All API keys stored locally, never sent to our servers
- Local models run entirely on your machine

## Troubleshooting

### "API error: Unauthorized"
- Check that your API key is correct
- Verify key has not expired
- For Anthropic, ensure key starts with `sk-ant-`

### "Connection refused" (Local)
- Ensure your inference server is running
- Check the endpoint URL is correct
- Verify firewall allows localhost connections

### "Model not found" (Local)
- Pull the model: `ollama pull <model-name>`
- Check model name spelling matches exactly
- For LM Studio, ensure model is loaded

### Poor Results with Local Models
- Try a larger model (e.g., `llama3.2:70b`)
- Use code-specialized models (codestral, deepseek-coder)
- Consider switching to cloud models for complex tasks

## Current Limitations

1. **Streaming**: Not yet supported (all responses wait for completion)
2. **Model-specific tuning**: Uses same prompts across providers
3. **Vision**: Image inputs not yet supported
4. **Context window**: No automatic management yet

## Future Enhancements

- [ ] Streaming responses for real-time feedback
- [ ] Provider-specific prompt optimization
- [ ] Azure OpenAI support
- [ ] Together.ai and other providers
- [ ] Automatic model fallback on errors
- [ ] Cost tracking per session
- [ ] Model performance benchmarking

## Security Notes

⚠️ **API Key Security:**
- Keys stored in browser localStorage
- Keys visible in DevTools
- Never commit `.env` files with keys
- Use separate keys for development/production
- Rotate keys regularly

⚠️ **Local Model Security:**
- Local models run arbitrary code during inference
- Only use models from trusted sources
- Keep inference server updated
- Be cautious with custom fine-tuned models
