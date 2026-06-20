# LM Studio Settings Testing UI

A comprehensive web-based interface for testing and configuring all LM Studio settings in one place.

## Features

### 🎛️ Three Main Configuration Tabs

#### 1. Model Configuration
- **Model Name**: Set the model identifier
- **Model Domain**: Choose between LLM (Language Model) or Embedding models
- **Model Path**: Specify the path to your model file (e.g., GGUF files)
- **Context Length**: Configure available context window (512-32768 tokens)
- **GPU Offload**: Set GPU acceleration percentage (0-100%)
- **Keep Model in Memory**: Prevent model unloading after inference
- **Try Memory Mapping**: Enable memory-mapped file I/O for better performance

#### 2. Inference Options
- **Temperature** (0-2): Controls output randomness
  - 0 = Deterministic/repetitive
  - 0.7 = Balanced (default)
  - 2 = Creative/chaotic
- **Top P** (0-1): Nucleus sampling parameter
  - Controls diversity by filtering tokens
- **Top K** (1-100): Limits sampling to top K tokens
  - Lower = more focused
  - Higher = more diverse
- **Max Tokens** (1-4096): Maximum response length

#### 3. Backend Settings
- **Host**: Server hostname (default: localhost)
- **Port**: Server port (default: 1234)
- **API URL**: Auto-calculated from host and port
- **Client Identifier**: Optional client ID for requests
- **Client Passkey**: Optional authentication token
- **Verbose Error Messages**: Enable detailed error logging

## Testing Capabilities

### Individual Tests
Each configuration section has a dedicated test button:
- **Test Model Config**: Validates model configuration
- **Test Inference Options**: Validates inference parameters with range checking
- **Test Backend Connection**: Attempts connection to the LM Studio backend

### Bulk Operations
- **Test All Settings**: Runs all three tests sequentially
- **Test Results Panel**: Shows up to 10 most recent test results with expandable details
- **Clear Results**: Clears test history

### Interactive Features
- Click any test result to expand and see detailed output
- Results display timestamp, status (✓ success / ✗ error), and full JSON/error messages
- Real-time validation with helpful tooltips

## Import/Export

### Export Settings
Download current settings as JSON for backup or sharing:
```json
{
  "model": {
    "name": "llama-2",
    "domain": "llm",
    "contextLength": 4096,
    "gpuOffload": 100,
    "keepModelInMemory": true
  },
  "inference": {
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "maxTokens": 512
  },
  "backend": {
    "host": "localhost",
    "port": 1234,
    "clientIdentifier": "my-app"
  },
  "exportedAt": "2024-06-20T11:19:46.621Z"
}
```

### Import Settings
Load previously saved settings from a JSON file with a single click. The UI will populate all fields with imported values.

### Reset All
Restore all settings to factory defaults with one click.

## Usage

### Basic Workflow
1. Configure model settings in the "Model Config" tab
2. Adjust inference parameters in the "Inference Options" tab
3. Set backend connection details in the "Backend Settings" tab
4. Click "Test All Settings" to validate your configuration
5. Review test results in the right panel
6. Export settings for later use

### Advanced Features

#### Range Sliders
- All numeric inputs feature dual controls: text input + visual slider
- Sync automatically in both directions
- Perfect for fine-tuning parameters

#### Real-time Validation
- Temperature: Checked to be between 0-2
- TopP: Validated to be between 0-1
- TopK: Must be >= 1
- MaxTokens: Must be >= 1

#### Connection Testing
Tests actual connectivity to the LM Studio backend:
- Attempts connection to configured API URL
- Includes optional client identification
- Reports HTTP status codes on failure

## Integration with LM Studio SDK

The settings UI integrates seamlessly with the LM Studio SDK:

```typescript
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient({
  host: settings.backend.host,
  port: settings.backend.port,
});

// Load model with configured settings
const model = await client.llm.load(settings.model.name, {
  contextLength: settings.model.contextLength,
  gpuOffload: settings.model.gpuOffload,
  keepModelInMemory: settings.model.keepModelInMemory,
});

// Generate with inference options
const response = await model.predict(prompt, {
  temperature: settings.inference.temperature,
  topP: settings.inference.topP,
  topK: settings.inference.topK,
  maxTokens: settings.inference.maxTokens,
});
```

## Component Structure

```
settingsUI.tsx (React Component)
├── Model Configuration Tab
│   ├── Text inputs (name, path)
│   ├── Dropdown (domain)
│   ├── Range sliders (context, GPU offload)
│   └── Checkboxes (keep in memory, mmap)
├── Inference Options Tab
│   ├── Range sliders (temperature, topP, topK, maxTokens)
│   └── Real-time validation
├── Backend Settings Tab
│   ├── Text inputs (host, port, identifiers)
│   └── Connection testing
├── Action Buttons (Test, Export, Import, Reset)
└── Test Results Panel
    ├── Result list with status indicators
    ├── Expandable result details
    └── Clear history button

settingsUI.css (Styling)
├── Dark theme with blue accents
├── Responsive grid layout
├── Custom range slider styling
├── Smooth transitions and animations
└── Mobile-friendly design
```

## Styling

- **Dark Theme**: Professional blue color scheme
- **Responsive**: Works on desktop (1200px+), tablet (768px-1200px), and mobile (<768px)
- **Accessibility**: 
  - Proper color contrast ratios
  - Keyboard navigation support
  - Clear focus indicators
  - Semantic HTML structure

### Color Palette
- Primary: `#2563eb` (Blue)
- Success: `#16a34a` (Green)
- Error: `#dc2626` (Red)
- Warning: `#ea580c` (Orange)
- Background: `#0f172a` (Dark Blue)
- Surface: `#1e293b` (Slate)

## Requirements

```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0"
}
```

## Installation

1. Copy `settingsUI.tsx` and `settingsUI.css` to your component directory
2. Import the component:
```tsx
import SettingsUI from './settingsUI';
```
3. Render in your app:
```tsx
<SettingsUI />
```

## Future Enhancements

- [ ] Real-time model inference testing with sample prompts
- [ ] Settings history/undo functionality
- [ ] Preset configurations (Quick Models: Llama, Mistral, etc.)
- [ ] Performance metrics dashboard
- [ ] A/B testing mode for parameter comparison
- [ ] Export test results as PDF report
- [ ] Advanced model loading options explorer
- [ ] Token counting and cost estimation
- [ ] Settings validation rules engine
- [ ] Collaborative settings sharing

## Troubleshooting

### Backend Connection Fails
- Verify LM Studio server is running on configured host:port
- Check firewall settings
- Ensure port number is correct (default: 1234)

### Settings Won't Import
- Verify JSON file is valid
- Check that all required fields are present
- Try exporting and comparing structure

### Parameters Not Applied
- Test settings to see validation errors
- Check console for error messages
- Ensure backend is properly connected

## Support

For issues or feature requests, refer to the main X-DEV-Open-Mind repository.
