'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/supabase/server';

const getOrigin = async () => {
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
};

export async function login(formData: FormData) {
<<<<<<< HEAD
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const expectedEmail = process.env.DEV_BYPASS_EMAIL ?? 'dev@titanos.local';
        const expectedPassword = process.env.DEV_BYPASS_PASSWORD ?? 'devpass123';

        if (email === expectedEmail && password === expectedPassword) {
            redirect('/dashboard');
        }
        return { error: 'Invalid dev credentials' };
    }

    const supabase = await createClient();
=======
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return { error: 'Supabase configuration is missing. Please check your environment variables.' };
        }
>>>>>>> 41458002e48634a169bc5731851fde0943ee8513

        const supabase = await createClient();

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { error: 'Email and password are required.' };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return { error: error.message };
        }

        revalidatePath('/', 'layout');
    } catch (err: any) {
        console.error('Login error:', err);
        return { error: 'An unexpected error occurred during sign in. Please try again later.' };
    }

    redirect('/dashboard');
}

export async function signup(formData: FormData) {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        return { success: 'Dev mode: account created.' };
    }

    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const origin = await getOrigin();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    return { success: 'Check your email to confirm your account.' };
}

export async function logout() {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        redirect('/login');
    }

    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}

export async function resetPassword(formData: FormData) {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        return { success: 'Dev mode: password reset skipped.' };
    }

    const supabase = await createClient();
    const email = formData.get('email') as string;
    const origin = await getOrigin();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: 'Check your email for the password reset link.' };
}

export async function updatePassword(formData: FormData) {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        redirect('/dashboard');
    }

    const supabase = await createClient();
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}
