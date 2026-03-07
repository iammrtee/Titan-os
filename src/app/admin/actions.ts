'use server';

import { updateUserRole, getCurrentUser } from '@/database/queries';
import { revalidatePath } from 'next/cache';

export async function updateUserAction(userId: string, newRole: 'admin' | 'pro' | 'growth' | 'starter') {
    const user = await getCurrentUser();

    // Additional security check on the server
    if (!user || (user.email !== 'tazrt37@gmail.com' && user.role !== 'admin')) {
        throw new Error('Unauthorized');
    }

    await updateUserRole(userId, newRole);
    revalidatePath('/admin');
}
