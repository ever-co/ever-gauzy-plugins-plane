import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileAssetsService {
	private readonly logger = new Logger(FileAssetsService.name);
	
	// Store pending uploads temporarily
	private pendingUploads = new Map<string, any>();
	
	constructor(
		private readonly apiFetchService: ApiFetchService,
		private configService: ConfigService
	) {}

	/**
	 * Plane frontend asks for an S3 signed URL.
	 * We return a mock response that points back to our own proxy.
	 */
	async initUpload(workspaceSlug: string, metadata: any, req: Request) {
		const assetId = uuidv4();
		
		// Store the metadata so we know what to do when the file arrives
		this.pendingUploads.set(assetId, { 
			workspaceSlug,
			metadata,
			timestamp: Date.now() 
		});

		// Clean up old pending uploads (older than 1 hour)
		this.cleanupPendingUploads();

		// Get the proxy URL to tell Plane where to upload
		const protocol = req.protocol || 'http';
		const host = req.get('host') || 'localhost:3300';
		const proxyUrl = `${protocol}://${host}`;

		// Return the mock S3 response Plane expects
		return {
			asset_id: assetId,
			asset_url: '', // Will be filled dynamically by Plane when it successfully uploads
			upload_data: {
				url: `${proxyUrl}/api/assets/v2/upload-proxy/${assetId}/`,
				fields: {
					'Content-Type': metadata.type || 'image/jpeg',
					key: `workspaces/${workspaceSlug}/${assetId}/${metadata.name || 'image.jpg'}`,
					'x-amz-algorithm': 'MOCK',
					'x-amz-credential': 'MOCK',
					'x-amz-date': new Date().toISOString(),
					policy: 'MOCK',
					'x-amz-signature': 'MOCK'
				}
			}
		};
	}

	/**
	 * Handle the actual multipart file upload from Plane.
	 * We forward this file to Gauzy's image-assets endpoint.
	 */
	async handleUpload(assetId: string, file: any, req: Request) {
		const pendingUpload = this.pendingUploads.get(assetId);
		
		if (!pendingUpload) {
			this.logger.warn(`Received upload for unknown or expired asset ID: ${assetId}`);
			// We still process it so Plane doesn't crash, but we can't tie it to metadata
		}

		if (!file) {
			throw new Error('No file provided');
		}

		try {
			// Forward the file to Gauzy using the API Fetch Service to include auth/tenant headers
			const formData = new FormData();
			
			// Extract original filename if available, or generate one
			const originalName = file.originalname || (pendingUpload?.metadata?.name) || 'upload.jpg';
			
			formData.append('file', file.buffer, {
				filename: originalName,
				contentType: file.mimetype,
				knownLength: file.size
			});
			
			// Forward to Gauzy's Image Asset upload endpoint
			// We use 'project_covers' as the folder since this is the primary asset Plane uploads
			const response = await this.apiFetchService.apiFetch({
				path: '/image-assets/upload/project_covers',
				method: 'POST',
				body: formData as any,
				customHeaders: {
					...formData.getHeaders(),
					...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
				}
			});
			
			this.logger.debug(`Successfully forwarded asset to Gauzy. Gauzy ID: ${response.data?.id}`);
			
			// Store the final Gauzy URL so we can return it when confirmed (though Plane often just trusts the client-side URL)
			if (pendingUpload) {
				pendingUpload.gauzyUrl = response.data?.url;
				this.pendingUploads.set(assetId, pendingUpload);
			}
			
			return response.data;
		} catch (e) {
			const error = e as Error;
			this.logger.error(`Failed to forward asset to Gauzy API: ${error.message}`);
			// If Gauzy fails, we still want to throw an error so the frontend knows it failed
			throw error;
		}
	}

	/**
	 * Plane confirms the upload was successful.
	 */
	async confirmUpload(assetId: string) {
		const upload = this.pendingUploads.get(assetId);
		
		if (upload) {
			// We could process the metadata here, but since we already forwarded to Gauzy during upload,
			// there's not much left to do. 
			this.pendingUploads.delete(assetId);
			return { success: true, url: upload.gauzyUrl };
		}
		
		return { success: true };
	}

	/**
	 * Periodically clean up pending uploads that were initiated but never followed through
	 */
	private cleanupPendingUploads() {
		const oneHourAgo = Date.now() - (60 * 60 * 1000);
		
		for (const [id, upload] of this.pendingUploads.entries()) {
			if (upload.timestamp < oneHourAgo) {
				this.pendingUploads.delete(id);
			}
		}
	}
}
