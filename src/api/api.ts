const API_URL = import.meta.env.VITE_API_URL;

export async function login(data: {email: string, password: string})
{
    const response = await fetch(`${API_URL}/login`,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    });
    return response.json();
}


export async function register(data: {name: string; email: string; password: string})
{
    const response = await fetch(`${API_URL}/register`,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    });
    return response.json();
}