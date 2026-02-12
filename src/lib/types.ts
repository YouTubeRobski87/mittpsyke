export interface Portal {
	key: string;
	title: string;
	description: string;
	icon: string;
	category: string;
}

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface CreateDiaryRequestBody {
	text: string;
	mood?: string | null;
	tags?: string[] | null;
}

export interface DiaryRecord {
	id: string;
	user_id: string;
	text: string;
	mood: string | null;
	tags: string[] | null;
	created_at: string;
}

export interface CreateDiarySuccessResponse {
	success: true;
	diary: DiaryRecord;
}

export interface CreateDiaryErrorResponse {
	success: false;
	error: string;
}

export interface UpdateDiaryRequestBody {
	id: string;
	text: string;
	mood?: string | null;
	tags?: string[] | null;
}

export interface UpdateDiarySuccessResponse {
	success: true;
	diary: DiaryRecord;
}

export interface UpdateDiaryErrorResponse {
	success: false;
	error: string;
}

export interface DeleteDiaryRequestBody {
	id: string;
}

export interface DeleteDiarySuccessResponse {
	success: true;
}

export interface DeleteDiaryErrorResponse {
	success: false;
	error: string;
}

export interface DiaryStatsTimelinePoint {
	date: string;
	mood: string;
}

export interface DiaryStatsTimelineSuccessResponse {
	success: true;
	data: DiaryStatsTimelinePoint[];
}

export interface DiaryStatsTimelineErrorResponse {
	success: false;
	error: string;
}
