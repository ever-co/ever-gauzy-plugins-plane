import { Controller, Post, Param, Body, Patch, Delete, Get, UseInterceptors, UploadedFile, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileAssetsService } from './file-assets.service';
import { Public } from '../auth/auth.guard';

@ApiTags('FileAssets')
@Controller('api/assets/v2')
@Public()
export class FileAssetsController {
	constructor(private readonly fileAssetsService: FileAssetsService) {}

	/**
	 * Step 1: Initialize workspace asset upload (Plane expects a signed S3 URL)
	 */
	@Post('workspaces/:slug/')
	async initWorkspaceAssetUpload(
		@Param('slug') workspaceSlug: string,
		@Body() metadata: any,
		@Req() req: Request
	) {
		return this.fileAssetsService.initUpload(workspaceSlug, metadata, req);
	}

	/**
	 * Step 1 (Project): Initialize project asset upload 
	 */
	@Post('workspaces/:slug/projects/:projectId/')
	async initProjectAssetUpload(
		@Param('slug') workspaceSlug: string,
		@Param('projectId') projectId: string,
		@Body() metadata: any,
		@Req() req: Request
	) {
		return this.fileAssetsService.initUpload(workspaceSlug, { ...metadata, origin_project_id: projectId }, req);
	}

	/**
	 * Step 1 (User): Initialize user asset upload 
	 */
	@Post('user-assets/')
	async initUserAssetUpload(
		@Body() metadata: any,
		@Req() req: Request
	) {
		return this.fileAssetsService.initUpload('users', metadata, req);
	}

	/**
	 * Step 2: Receive the actual file (Plane uploads to the S3 URL we provided)
	 * We use a custom endpoint prefix `upload-proxy` that we returned in Step 1
	 */
	@Post(['upload-proxy/:assetId', 'upload-proxy/:assetId/'])
	@UseInterceptors(FileInterceptor('file'))
	async handleFileUpload(
		@Param('assetId') assetId: string,
		@UploadedFile() file: any,
		@Req() req: Request,
		@Res() res: Response
	) {
		try {
			await this.fileAssetsService.handleUpload(assetId, file, req);
			return res.status(HttpStatus.NO_CONTENT).send();
		} catch (e) {
			const error = e as Error;
			return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
		}
	}

	/**
	 * Step 3: Confirm workspace/project asset upload
	 */
	@Patch('workspaces/:slug/:assetId/')
	async confirmWorkspaceAsset(@Param('assetId') assetId: string) {
		return this.fileAssetsService.confirmUpload(assetId);
	}

	@Patch('workspaces/:slug/projects/:projectId/:assetId/')
	async confirmProjectAsset(@Param('assetId') assetId: string) {
		return this.fileAssetsService.confirmUpload(assetId);
	}

	@Patch('user-assets/:assetId/')
	async confirmUserAsset(@Param('assetId') assetId: string) {
		return this.fileAssetsService.confirmUpload(assetId);
	}

	/**
	 * Bulk status update
	 */
	@Post('workspaces/:slug/:entityId/bulk/')
	async bulkWorkspaceAssetUpload(
		@Body() payload: { asset_ids: string[] }
	) {
		return { success: true };
	}

	@Post('workspaces/:slug/projects/:projectId/:entityId/bulk/')
	async bulkProjectAssetUpload(
		@Body() payload: { asset_ids: string[] }
	) {
		return { success: true };
	}

	/**
	 * Check
	 */
	@Get('workspaces/:slug/check/:assetId/')
	async checkAsset() {
		return { exists: true };
	}

	/**
	 * Deletions (No-op in proxy for now, but return success to avoid blocking UI)
	 */
	@Delete('workspaces/:slug/:assetId/')
	async deleteWorkspaceAsset() {
		return { success: true };
	}
	
	@Delete('user-assets/:assetId/')
	async deleteUserAsset() {
		return { success: true };
	}
}
