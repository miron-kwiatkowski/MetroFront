const RAW_API_URL = import.meta.env.VITE_API_URL as string | undefined;

function getApiUrl(): string {
    const url = (RAW_API_URL ?? '').trim();
    return url.replace(/\/+$/, '');
}

export type ApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; status: number; message: string; details?: unknown };

function extractMessage(payload: unknown): string | null {
    if (typeof payload === 'string') {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const anyPayload = payload as Record<string, unknown>;
        if (typeof anyPayload.message === 'string') return anyPayload.message;
        if (typeof anyPayload.error === 'string') return anyPayload.error;
        if (typeof anyPayload.title === 'string') return anyPayload.title;
    }

    return null;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
    const baseUrl = getApiUrl();
    if (!baseUrl) {
        return { ok: false, status: 0, message: 'Brak VITE_API_URL w .env' };
    }

    const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    try {
        const res = await fetch(url, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...(init?.headers ?? {}),
            },
        });

        const text = await res.text().catch(() => '');
        const contentType = res.headers.get('content-type') ?? '';
        const looksLikeJson = text.trim().startsWith('{') || text.trim().startsWith('[');

        let payload: unknown = text;

        if (contentType.includes('application/json') || looksLikeJson) {
            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                payload = text;
            }
        }


        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                message: extractMessage(payload) ?? `Błąd HTTP ${res.status}`,
                details: payload,
            };
        }

        return { ok: true, data: payload as T };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            message: 'Nie udało się połączyć z API.',
            details: err,
        };
    }
}

/** AUTH **/
export type LoginResponse = { access_token: string };

export async function login(data: { email: string; password: string }): Promise<ApiResult<LoginResponse>> {
    return request<LoginResponse>('/account/login', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function register(data: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}): Promise<ApiResult<unknown>> {
    return request<unknown>('/account/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/** SCHEMAS / LINES / STATIONS **/
export type SchemaDto = {
    id: number;
    name: string;
    description: string;
    city: string;
    country: string;
    isPublic: boolean;
};

export async function getSchemas(token: string): Promise<ApiResult<SchemaDto[]>> {
    return request<SchemaDto[]>('/schemas', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export type AddSchemaRequest = {
    name: string;
    description: string;
    city: string;
    country: string;
    isPublic: boolean;
};

export async function addSchema(token: string, data: AddSchemaRequest): Promise<ApiResult<unknown>> {
    return request<unknown>('/schemas', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export type LineDto = {
    id: number;
    schemaId: number;
    lineCategoryId: number;
    name: string;
    lineNumber: number;
    color: string;
    isCircular: boolean;
};

export async function getLinesBySchemaId(token: string, schemaId: number): Promise<ApiResult<LineDto[]>> {
    return request<LineDto[]>(`/lines/schema/${schemaId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export type AddLineRequest = {
    schemaId: number;
    lineCategoryId: number;
    name: string;
    lineNumber: number;
    color: string;
    isCircular: boolean;
};

export async function addLine(token: string, data: AddLineRequest): Promise<ApiResult<unknown>> {
    return request<unknown>('/lines', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export type StationDto = {
    id: number;
    schemaId: number;
    name: string;
    latitude: number;
    longitude: number;
    positionX: number;
    positionY: number;
    isTransfer: boolean;
    description: string;
};

export async function getStationsBySchemaId(token: string, schemaId: number): Promise<ApiResult<StationDto[]>> {
    return request<StationDto[]>(`/stations/schema/${schemaId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export type AddStationRequest = {
    schemaId: number;
    name: string;
    latitude: number;
    longitude: number;
    positionX: number;
    positionY: number;
    isTransfer: boolean;
    description: string;
    lineIds: number[];
};

export async function addStation(token: string, data: AddStationRequest): Promise<ApiResult<unknown>> {
    return request<unknown>('/stations', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export type EditStationRequest = {
    name?: string;
    latitude?: number;
    longitude?: number;
    positionX?: number;
    positionY?: number;
    isTransfer?: boolean;
    description?: string;
};

export async function updateStation(token: string, stationId: number, data: EditStationRequest): Promise<ApiResult<unknown>> {
    return request<unknown>(`/stations/${stationId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function deleteStation(token: string, stationId: number): Promise<ApiResult<unknown>> {
    return request<unknown>(`/stations/${stationId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** SHARING **/
export type SharedSchemaDto = {
    id: number;
    schemaId: number;
    schemaName: string;
    sharedWithUserId: string;
    sharedWithEmail: string;
    accessLevel: string;
    sharedAt: string;
};

export type ShareSchemaRequest = {
    schemaId: number;
    sharedWithUserId: string;
    accessLevel: 'Read' | 'Write' | string;
};

export async function shareSchema(token: string, data: ShareSchemaRequest): Promise<ApiResult<unknown>> {
    return request<unknown>('/sharedschema/share', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function getSharedByMe(token: string): Promise<ApiResult<SharedSchemaDto[]>> {
    return request<SharedSchemaDto[]>('/sharedschema/shared-by-me', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function getSharedWithMe(token: string): Promise<ApiResult<SharedSchemaDto[]>> {
    return request<SharedSchemaDto[]>('/sharedschema/shared-with-me', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function removeShare(token: string, sharedId: number): Promise<ApiResult<unknown>> {
    return request<unknown>(`/sharedschema/${sharedId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** STATISTICS **/
export type SchemaStatisticsDto = {
    id: number;
    schemaId: number;
    schemaName: string;
    stationCount: number;
    lineCount: number;
    connectionCount: number;
    longestLineName?: string | null;
    longestLineStationCount: number;
    mostConnectedStationName?: string | null;
    mostConnectedStationConnectionCount: number;
    totalNetworkLength: number;
    calculatedAt: string;
};

export async function getStatisticsBySchemaId(token: string, schemaId: number): Promise<ApiResult<SchemaStatisticsDto>> {
    return request<SchemaStatisticsDto>(`/statistics/${schemaId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function recalculateStatistics(token: string, schemaId: number): Promise<ApiResult<unknown>> {
    return request<unknown>(`/statistics/${schemaId}/recalculate`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function getAllStatistics(token: string): Promise<ApiResult<SchemaStatisticsDto[]>> {
    return request<SchemaStatisticsDto[]>('/statistics', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** LINE CATEGORIES **/
export type LineCategoryDto = {
    id: number;
    name: string;
    color: string;
};

export type AddLineCategoryRequest = {
    name: string;
    color: string;
};

export async function getLineCategories(token: string): Promise<ApiResult<LineCategoryDto[]>> {
    return request<LineCategoryDto[]>('/line-categories', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function addLineCategory(token: string, data: AddLineCategoryRequest): Promise<ApiResult<unknown>> {
    return request<unknown>('/line-categories', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function updateLineCategory(token: string, id: number, data: AddLineCategoryRequest): Promise<ApiResult<unknown>> {
    return request<unknown>(`/line-categories/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function deleteLineCategory(token: string, id: number): Promise<ApiResult<unknown>> {
    return request<unknown>(`/line-categories/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** USERS (Admin) **/
export type AdminUserDto = Record<string, unknown> & {
    id?: string;
    email?: string;
    username?: string;
    name?: string;
    firstname?: string;
    lastname?: string;
    isLocked?: boolean;
    locked?: boolean;
    roles?: string[];
};

export async function getUsers(token: string): Promise<ApiResult<AdminUserDto[]>> {
    return request<AdminUserDto[]>('/users', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function lockUser(token: string, userId: string): Promise<ApiResult<unknown>> {
    return request<unknown>(`/users/lock/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function unlockUser(token: string, userId: string): Promise<ApiResult<unknown>> {
    return request<unknown>(`/users/unlock/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function addUserRole(token: string, userId: string, roleName: string): Promise<ApiResult<unknown>> {
    return request<unknown>(`/users/${encodeURIComponent(userId)}/role/${encodeURIComponent(roleName)}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function removeUserRole(token: string, userId: string, roleName: string): Promise<ApiResult<unknown>> {
    return request<unknown>(`/users/${encodeURIComponent(userId)}/role/${encodeURIComponent(roleName)}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** LOGS **/
export async function getAdminLogs(token: string, date: string, lines: number = 200): Promise<ApiResult<string>> {
    const qs = new URLSearchParams();
    if (lines) qs.set('lines', String(lines));
    return request<string>(`/admin/logs/${encodeURIComponent(date)}?${qs.toString()}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function getUserLogs(token: string, date?: string, lines: number = 200): Promise<ApiResult<string>> {
    const qs = new URLSearchParams();
    if (date) qs.set('date', date);
    if (lines) qs.set('lines', String(lines));
    const q = qs.toString();
    return request<string>(`/users/logs${q ? `?${q}` : ''}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

/** STATION-LINES (station ↔ line) **/
export type StationLineDto = {
    stationId: number;
    lineId: number;
    station?: unknown;
    line?: unknown;
};

export async function getStationLinesByStationId(token: string, stationId: number): Promise<ApiResult<StationLineDto[]>> {
    return request<StationLineDto[]>(`/station-lines/station/${stationId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getStationLinesByLineId(token: string, lineId: number): Promise<ApiResult<StationLineDto[]>> {
    return request<StationLineDto[]>(`/station-lines/line/${lineId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function addStationLine(
    token: string,
    station: StationDto,
    line: LineDto,
    lineCategory: LineCategoryDto
): Promise<ApiResult<unknown>> {
    const safe = (v: string | null | undefined, fallback: string) => {
        const t = (v ?? '').trim();
        return t.length ? t : fallback;
    };

    const stationPayload = {
        id: station.id,
        schemaId: station.schemaId,
        name: safe(station.name, ' '),
        latitude: station.latitude,
        longitude: station.longitude,
        positionX: station.positionX,
        positionY: station.positionY,
        isTransfer: station.isTransfer,
        description: safe(station.description, ' '),
    };

    const linePayload = {
        id: line.id,
        schemaId: line.schemaId,
        lineCategoryId: line.lineCategoryId,
        lineCategory: {
            id: lineCategory.id,
            name: safe(lineCategory.name, ' '),
            color: safe(lineCategory.color, '#000000'),
        },
        name: safe(line.name, ' '),
        lineNumber: line.lineNumber,
        color: safe(line.color, '#000000'),
        isCircular: line.isCircular,
    };

    return request<unknown>('/station-lines', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            stationId: station.id,
            lineId: line.id,
            station: stationPayload,
            line: linePayload,
        }),
    });
}

export async function deleteStationLine(token: string, stationId: number, lineId: number): Promise<ApiResult<unknown>> {
    return request<unknown>(`/station-lines/station/${stationId}/line/${lineId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

/** STATION-CONNECTIONS (connections between stations) **/
export type StationConnectionDto = {
    id: number;
    schemaId: number;
    lineId: number;
    fromStationId: number;
    toStationId: number;
    path?: string | null;
};

export type AddStationConnectionRequest = {
    schemaId: number;
    lineId: number;
    fromStationId: number;
    toStationId: number;
    path?: string | null;
};

export async function getStationConnectionsBySchemaId(token: string, schemaId: number): Promise<ApiResult<StationConnectionDto[]>> {
    return request<StationConnectionDto[]>(`/station-connections/schema/${schemaId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getStationConnectionsByLineId(token: string, lineId: number): Promise<ApiResult<StationConnectionDto[]>> {
    return request<StationConnectionDto[]>(`/station-connections/line/${lineId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function addStationConnection(token: string, data: AddStationConnectionRequest): Promise<ApiResult<StationConnectionDto>> {
    return request<StationConnectionDto>('/station-connections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function deleteStationConnection(token: string, id: number): Promise<ApiResult<unknown>> {
    return request<unknown>(`/station-connections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}
