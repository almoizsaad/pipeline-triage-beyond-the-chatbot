import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import sharp from 'sharp';
import * as fs from 'fs';

/**
 * Tool for extracting image metadata using the sharp library.
 */
export class ImageMetadataTool implements Tool<{ path: string }, any> {
  public readonly name = 'image_metadata';
  public readonly description = 'Extract dimensions, type, format, and size of an image file.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.1.0',
    category: 'utility',
    tags: ['image', 'metadata', 'exif', 'sharp'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['fs_read'],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 5000
  };

  public readonly inputSchema = z.object({
    path: z.string().describe('Path to the image file')
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: { path: string }): Promise<any> {
    try {
      if (!fs.existsSync(input.path)) {
        throw new Error(`File not found: ${input.path}`);
      }

      const image = sharp(input.path);
      const metadata = await image.metadata();
      const stats = fs.statSync(input.path);

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        hasAlpha: metadata.hasAlpha,
        space: metadata.space,
        channels: metadata.channels,
        density: metadata.density
      };
    } catch (e) {
      console.error(`[ImageMetadataTool] Failed to extract metadata for ${input.path}:`, e);
      throw e;
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
