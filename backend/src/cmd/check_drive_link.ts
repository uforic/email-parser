import fetch from 'node-fetch';
import { Context } from '../context';

export const checkDriveLink = async (href: string) => {
    const result = await fetch(href, {
        redirect: 'manual',
    });
    return { ok: result.ok, status: result.status };
};
