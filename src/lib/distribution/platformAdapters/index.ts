export interface DistributionResult {
    success: boolean;
    platformJobId?: string;
    error?: string;
}

export interface PlatformAdapter {
    postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult>;
}
