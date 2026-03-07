import { redirect } from 'next/navigation';
import { getCurrentUser, getAllUsers } from '@/database/queries';
import UsersTable from '@/components/admin/UsersTable';

export const metadata = {
    title: 'Admin Dashboard | TitanOS',
};

export default async function AdminPage() {
    const user = await getCurrentUser();

    if (!user || (user.email !== 'tazrt37@gmail.com' && user.role !== 'admin')) {
        redirect('/dashboard');
    }

    const users = await getAllUsers();

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
                    <p className="text-zinc-400 mt-2">Manage users and platform access.</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <UsersTable initialUsers={users} />
                </div>
            </div>
        </div>
    );
}
