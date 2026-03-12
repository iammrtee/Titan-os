type MockUser = {
    id: string;
    email: string | null;
};

type MockResult<T> = Promise<{ data: T; error: null }>;

const DEFAULT_EMAIL = 'dev@titanos.local';
const DEFAULT_PASSWORD = 'devpass123';
const DEFAULT_USER_ID = 'dev-user';
const STATIC_DATE = '2026-01-01T00:00:00.000Z';

export function isBypassEnabled(): boolean {
    return process.env.DEV_BYPASS_AUTH === 'true';
}

export function isBypassEnabledClient(): boolean {
    return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
}

function resolveEmail(override?: string): string {
    return override || process.env.DEV_BYPASS_EMAIL || DEFAULT_EMAIL;
}

function resolvePassword(override?: string): string {
    return override || process.env.DEV_BYPASS_PASSWORD || DEFAULT_PASSWORD;
}

function createMockUser(emailOverride?: string): MockUser {
    return {
        id: DEFAULT_USER_ID,
        email: resolveEmail(emailOverride),
    };
}

class MockQuery {
    private table: string;
    private user: MockUser;
    private filters: Record<string, any> = {};
    private insertPayload: any = null;

    constructor(table: string, user: MockUser) {
        this.table = table;
        this.user = user;
    }

    select() {
        return this;
    }

    insert(payload: any) {
        this.insertPayload = payload;
        return this;
    }

    update() {
        return this;
    }

    delete() {
        return this;
    }

    eq(column: string, value: any) {
        this.filters[column] = value;
        return this;
    }

    in(column: string, values: any[]) {
        this.filters[column] = values;
        return this;
    }

    order() {
        return this;
    }

    single(): MockResult<any> {
        return Promise.resolve({ data: this.buildSingle(), error: null });
    }

    maybeSingle(): MockResult<any> {
        return Promise.resolve({ data: this.buildSingle(), error: null });
    }

    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ) {
        return Promise.resolve({ data: this.buildList(), error: null }).then(onfulfilled, onrejected);
    }

    private buildSingle() {
        if (this.insertPayload) {
            const payload = Array.isArray(this.insertPayload) ? this.insertPayload[0] : this.insertPayload;
            return {
                id: this.filters.id ?? `dev-${this.table}`,
                created_at: STATIC_DATE,
                ...payload,
            };
        }

        if (this.table === 'users') {
            return {
                id: this.user.id,
                email: this.user.email,
                role: 'starter',
                created_at: STATIC_DATE,
            };
        }

        if (this.table === 'projects') {
            return {
                id: this.filters.id ?? 'dev-project',
                name: 'Dev Project',
                website_url: 'https://example.com',
                status: 'pending',
                created_at: STATIC_DATE,
            };
        }

        if (this.table === 'campaigns') {
            return {
                id: this.filters.id ?? 'dev-campaign',
                status: 'draft',
                flyer_image_url: null,
                flyer_content: '',
                flyer_style: null,
                created_at: STATIC_DATE,
            };
        }

        return null;
    }

    private buildList() {
        if (this.table === 'projects') return [];
        if (this.table === 'campaigns') return [];
        if (this.table === 'campaign_content') return [];
        if (this.table === 'campaign_calendar') return [];
        if (this.table === 'assets') return [];
        if (this.table === 'social_accounts') return [];
        return [];
    }
}

function createMockStorage() {
    return {
        async listBuckets() {
            return { data: [], error: null };
        },
        async createBucket() {
            return { data: null, error: null };
        },
        from() {
            return {
                async createSignedUploadUrl() {
                    return {
                        data: null,
                        error: { message: 'Bypass mode: storage disabled' },
                    };
                },
                async remove() {
                    return { data: null, error: null };
                },
                getPublicUrl(path: string) {
                    return { data: { publicUrl: `https://dev.storage.local/titanleap-assets-v1/${path}` } };
                }
            };
        },
    };
}

export function createMockClient(options?: { email?: string; password?: string }) {
    const user = createMockUser(options?.email);
    const expectedEmail = resolveEmail(options?.email);
    const expectedPassword = resolvePassword(options?.password);

    return {
        auth: {
            async getUser() {
                return { data: { user }, error: null };
            },
            async signInWithPassword({ email, password }: { email: string; password: string }) {
                if (email === expectedEmail && password === expectedPassword) {
                    return {
                        data: { user, session: { access_token: 'dev-access', user } },
                        error: null,
                    };
                }
                return { data: { user: null, session: null }, error: { message: 'Invalid dev credentials' } };
            },
            async signUp() {
                return { data: { user }, error: null };
            },
            async signOut() {
                return { error: null };
            },
            async resetPasswordForEmail() {
                return { data: {}, error: null };
            },
            async updateUser() {
                return { data: { user }, error: null };
            },
            async exchangeCodeForSession() {
                return { data: { user, session: { access_token: 'dev-access', user } }, error: null };
            },
        },
        from(table: string) {
            return new MockQuery(table, user);
        },
        storage: createMockStorage(),
    };
}

export function createMockAdminClient(options?: { email?: string; password?: string }) {
    return createMockClient(options);
}
