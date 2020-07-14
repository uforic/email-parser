import fetch from 'node-fetch';

export const checkDriveLink = async (href: string) => {
    const result = await fetch(href, {
        redirect: 'manual',
    });
    return { ok: result.ok, status: result.status };
};
