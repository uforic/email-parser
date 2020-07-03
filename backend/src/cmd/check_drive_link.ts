import fetch from 'node-fetch';
import { Context } from '../context';

export const checkDriveLink = async (context: Context, href: string) => {
    const result = await fetch(href, {
        redirect: 'manual',
    });
    return { ok: result.ok, status: result.status };
};
