'use client';

import { useState } from 'react';
import type { UserProfile, UserRole } from '@/types';
import { updateUserAction } from '@/app/admin/actions';

interface UsersTableProps {
    initialUsers: UserProfile[];
}

export default function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setUpdatingId(userId);
            await updateUserAction(userId, newRole);

            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Failed to update user role:', error);
            alert('Failed to update user role.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-neutral-950 text-xs uppercase text-zinc-500 border-b border-neutral-800">
                    <tr>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-800 border ${user.role === 'admin' ? 'border-purple-500/50 text-purple-400' :
                                        user.role === 'pro' || user.role === 'growth' ? 'border-emerald-500/50 text-emerald-400' :
                                            'border-neutral-700 text-zinc-400'
                                    }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <select
                                    disabled={updatingId === user.id}
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                    className="bg-neutral-950 border border-neutral-700 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="growth">Growth</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && (
                <div className="p-8 text-center text-zinc-500">
                    No users found.
                </div>
            )}
        </div>
    );
}
