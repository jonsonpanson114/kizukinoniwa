import 'react-native-url-polyfill/auto';
import { Config } from './config';

/**
 * Anti-Gravity Data Layer (GAS Wrapper)
 * Supabase が不明なため、Google Apps Script を DB として使用する影武者。
 */
class GasSupabaseEmulation {
    private url = Config.GAS_URL;
    private token = Config.GAS_AUTH_TOKEN;

    from(table: string) {
        if (table !== 'stories') {
            console.warn(`[GAS] Table "${table}" is not supported. Redirecting to stories.`);
        }

        return {
            insert: async (data: any) => {
                console.log('[GAS] Inserting story...', data[0]);
                try {
                    const response = await fetch(this.url, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'save_story',
                            auth_token: this.token,
                            story: data[0]
                        }),
                    });
                    const result = await response.json();
                    console.log('[GAS] Insert Response:', result);
                    return { data: result, error: result.error ? result : null };
                } catch (e) {
                    console.error('[GAS] Insert Failed:', e);
                    return { data: null, error: e };
                }
            },
            select: () => ({
                order: async () => {
                    console.log('[GAS] Fetching stories...');
                    try {
                        const response = await fetch(this.url, {
                            method: 'POST',
                            body: JSON.stringify({
                                action: 'get_stories',
                                auth_token: this.token
                            }),
                        });
                        const result = await response.json();
                        console.log('[GAS] Select Response:', result);
                        return { data: result.stories, error: result.error ? result : null };
                    } catch (e) {
                        console.error('[GAS] Select Failed:', e);
                        return { data: null, error: e };
                    }
                }
            })
        };
    }
}

export const supabase = new GasSupabaseEmulation() as any;
