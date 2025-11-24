# AI-Powered Testing with Gemini 2.5 Flash

## Overview

The integration tests for the Sonos MCP agent use Google's Gemini 2.5 Flash AI model to intelligently validate test outputs instead of relying on simple string matching or regex patterns.

## Why AI-Powered Testing?

Traditional integration tests use brittle assertions like:
- `expect(stdout).toContain('Kitchen')` - Fails if the output format changes
- `expect(stdout).toLowerCase()).toMatch(/not playing|stopped|paused/)` - Limited pattern matching
- `expect(stdout).toBeTruthy()` - Vague validation

AI-powered testing offers:
- **Semantic Understanding**: Validates the meaning of the output, not just exact strings
- **Flexibility**: Adapts to different output formats and phrasings
- **Better Error Messages**: Explains why a test failed in human-readable terms
- **Natural Language Expectations**: Test expectations written as plain English

## How It Works

### 1. Test Execution
Each test runs a command against the Sonos agent CLI:
```typescript
const { stdout } = await execAsync('npm run agent -- "get Kitchen volume"');
```

### 2. AI Validation
The output is sent to Gemini 2.5 Flash with:
- **User Request**: The original command prompt
- **Expected Behavior**: A natural language description of what should happen
- **Actual Output**: The agent's response

```typescript
const validation = await validateWithAI(
    'get Kitchen volume',
    stdout,
    'The output should report that the Kitchen device volume is currently at 10 or level 10.'
);
```

### 3. Structured Response
Gemini returns a structured JSON response:
```json
{
    "isValid": true,
    "reason": "The output correctly reports the Kitchen volume as 10"
}
```

### 4. Test Assertion
The test uses the AI's validation result:
```typescript
expect(validation.isValid).toBe(true);
if (!validation.isValid) {
    throw new Error(`AI validation failed: ${validation.reason}`);
}
```

## Implementation Details

### Model Configuration
- **Model**: `gemini-2.0-flash-exp` (Gemini 2.5 Flash experimental)
- **SDK**: `@ai-sdk/google` with `ai` package's `generateText` function
- **Response Format**: JSON with `isValid` boolean and `reason` string

### Validation Function
```typescript
async function validateWithAI(
    prompt: string, 
    output: string, 
    expectedBehavior: string
): Promise<ValidationResult>
```

**Parameters:**
- `prompt`: The user's original command
- `output`: The agent's response text
- `expectedBehavior`: Natural language description of expected result

**Returns:**
- `ValidationResult` object with `isValid` boolean and `reason` string

### Environment Requirements
The Gemini API requires authentication via an API key. Ensure you have:
- `GOOGLE_GENERATIVE_AI_API_KEY` environment variable set
- Or the appropriate credentials configured for `@ai-sdk/google`

## Test Examples

### Example 1: Device Discovery
```typescript
it('should check if Kitchen device is present', async () => {
    const { stdout } = await execAsync('npm run agent -- "list all sonos devices"');
    
    const validation = await validateWithAI(
        'list all sonos devices',
        stdout,
        'The output should include a device named "Kitchen" among the list of discovered Sonos devices.'
    );

    expect(validation.isValid).toBe(true);
}, 60000);
```

**What This Tests:**
- The agent can discover devices
- The Kitchen device is present in the output
- The AI understands various output formats (JSON, text, formatted lists, etc.)

### Example 2: Playback State
```typescript
it('should check if nothing is playing', async () => {
    const { stdout } = await execAsync('npm run agent -- "check if Kitchen is playing anything"');
    
    const validation = await validateWithAI(
        'check if Kitchen is playing anything',
        stdout,
        'The output should indicate the playback state of the Kitchen device (playing, stopped, paused, or not playing).'
    );

    expect(validation.isValid).toBe(true);
}, 60000);
```

**What This Tests:**
- The agent can check playback status
- The output contains meaningful playback state information
- Works regardless of how the state is phrased ("not playing", "stopped", "paused", etc.)

### Example 3: Volume Control
```typescript
it('should set Kitchen volume to 10', async () => {
    const { stdout } = await execAsync('npm run agent -- "set Kitchen volume to 10"');
    
    const validation = await validateWithAI(
        'set Kitchen volume to 10',
        stdout,
        'The output should confirm that the Kitchen device volume has been set to 10 or level 10.'
    );

    expect(validation.isValid).toBe(true);
}, 60000);
```

**What This Tests:**
- The agent can set volume levels
- The output confirms the action was completed
- Recognizes various confirmation phrasings

## Benefits Over Traditional Testing

| Traditional Testing | AI-Powered Testing |
|---------------------|-------------------|
| `expect(stdout).toContain('10')` | Understands "volume level 10", "set to 10%", "level: 10" |
| Brittle regex patterns | Semantic understanding of intent |
| Hard-coded expected strings | Natural language expectations |
| Fails on format changes | Adapts to different formats |
| No context awareness | Understands the full context |

## Limitations and Considerations

1. **API Dependency**: Requires internet connection and valid Gemini API credentials
2. **Performance**: AI validation adds latency (~1-3 seconds per test)
3. **Cost**: Gemini API calls may have associated costs (though Flash model is optimized for cost)
4. **Non-Determinism**: AI responses may vary slightly between runs
5. **Timeout**: Tests have increased timeout (60 seconds) to accommodate AI validation

## Best Practices

1. **Clear Expected Behavior**: Write specific, unambiguous expected behavior descriptions
2. **Meaningful Prompts**: Include the original user request for context
3. **Error Handling**: Always check `validation.isValid` and throw with `validation.reason`
4. **Timeouts**: Use generous timeouts (60s) for AI validation
5. **Environment Variables**: Document required API keys in README

## Future Enhancements

Potential improvements to the AI testing framework:
- Caching validation results for identical outputs
- Confidence scores in validation responses
- Multiple validation rounds for critical tests
- Fallback to traditional assertions if AI validation fails
- Custom Gemini system prompts for domain-specific validation
