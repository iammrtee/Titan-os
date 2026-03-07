import { PlatformAdapter, DistributionResult } from './index';

export class MockPlatformAdapter implements PlatformAdapter {
    constructor(private platformName: string) { }

    async postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult> {
        console.log(`[MockAdapter] Simulation: Posting to ${this.platformName}...`);
        console.log(`[MockAdapter] URL: ${assetUrl}`);
        console.log(`[MockAdapter] Content: ${content.slice(0, 50)}...`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Randomly simulate success or failure (90% success)
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            return {
                success: true,
                platformJobId: `mock_${this.platformName}_${Date.now()}`
            };
        } else {
            return {
                success: false,
                error: 'Simulated network timeout'
            };
        }
    }
}
