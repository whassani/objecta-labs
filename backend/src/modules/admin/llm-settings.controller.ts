import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Controller('settings/llm')
@UseGuards(JwtAuthGuard)
export class LLMSettingsController {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      database: this.configService.get('DB_NAME'),
      user: this.configService.get('DB_USER'),
      password: this.configService.get('DB_PASSWORD'),
    });
  }

  @Get()
  async getLLMSettings(@Req() req: any) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    // Get settings from secrets vault
    const result = await this.pool.query(
      `SELECT key, encrypted_value 
       FROM secrets_vault 
       WHERE organization_id = $1 
       AND key IN ('openai_api_key', 'anthropic_api_key', 'gemini_api_key', 'cohere_api_key', 'mistral_api_key', 'huggingface_api_key', 'ollama_url')`,
      [organizationId]
    );

    const settings: any = {
      hasOpenAIKey: false,
      hasAnthropicKey: false,
      hasGeminiKey: false,
      hasCohereKey: false,
      hasMistralKey: false,
      hasHuggingFaceKey: false,
      ollamaUrl: null,
    };

    for (const row of result.rows) {
      if (row.key === 'openai_api_key' && row.encrypted_value) {
        settings.hasOpenAIKey = true;
      } else if (row.key === 'anthropic_api_key' && row.encrypted_value) {
        settings.hasAnthropicKey = true;
      } else if (row.key === 'gemini_api_key' && row.encrypted_value) {
        settings.hasGeminiKey = true;
      } else if (row.key === 'cohere_api_key' && row.encrypted_value) {
        settings.hasCohereKey = true;
      } else if (row.key === 'mistral_api_key' && row.encrypted_value) {
        settings.hasMistralKey = true;
      } else if (row.key === 'huggingface_api_key' && row.encrypted_value) {
        settings.hasHuggingFaceKey = true;
      } else if (row.key === 'ollama_url') {
        // Decrypt and return Ollama URL (it's not sensitive)
        settings.ollamaUrl = this.decrypt(row.encrypted_value);
      }
    }

    return settings;
  }

  @Post()
  async saveLLMSettings(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const { 
      openaiApiKey, 
      anthropicApiKey, 
      geminiApiKey, 
      cohereApiKey, 
      mistralApiKey, 
      huggingfaceApiKey,
      ollamaUrl 
    } = body;

    // Save to secrets vault
    const keysToSave = [
      { key: 'openai_api_key', value: openaiApiKey },
      { key: 'anthropic_api_key', value: anthropicApiKey },
      { key: 'gemini_api_key', value: geminiApiKey },
      { key: 'cohere_api_key', value: cohereApiKey },
      { key: 'mistral_api_key', value: mistralApiKey },
      { key: 'huggingface_api_key', value: huggingfaceApiKey },
      { key: 'ollama_url', value: ollamaUrl },
    ];

    for (const item of keysToSave) {
      if (item.value) {
        await this.pool.query(
          `INSERT INTO secrets_vault (organization_id, key, encrypted_value, created_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (organization_id, key)
           DO UPDATE SET encrypted_value = $3, updated_at = NOW()`,
          [organizationId, item.key, this.encrypt(item.value), userId]
        );
      }
    }

    return { success: true, message: 'LLM settings saved successfully' };
  }

  // Simple encryption (you should use proper encryption in production)
  private encrypt(text: string): string {
    // For now, just base64 encode. In production, use proper encryption
    return Buffer.from(text).toString('base64');
  }

  private decrypt(encrypted: string): string {
    // For now, just base64 decode. In production, use proper decryption
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }
}
